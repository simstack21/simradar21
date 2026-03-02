import { mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { rdsGetSingle, rdsSetSingle } from "@sr24/db/redis";
import type { NavigraphPackage } from "@sr24/types/db";
import type { NavigraphAirport, NavigraphAirway, NavigraphDataset, NavigraphNavaid, NavigraphSid, NavigraphWaypoint } from "@sr24/types/navigraph";
import { path7za } from "7zip-bin";
import Database from "better-sqlite3";
import Seven from "node-7z";
import { uploadToR2 } from "./s3.js";

const NAVIGRAPH_TOKEN_URL = "https://identity.api.navigraph.com/connect/token";
const NAVIGRAPH_PACKAGES_URL = "https://api.navigraph.com/v1/navdata/packages";

interface NavigraphApiFile {
	file_id: string;
	key: string;
	hash: string;
	signed_url: string;
}

interface NavigraphApiPackage {
	package_id: string;
	format: string;
	description: string;
	cycle: string;
	revision: string;
	package_status: "current" | "outdated" | "future";
	files: NavigraphApiFile[];
}

async function getServerToken(): Promise<string> {
	const response = await fetch(NAVIGRAPH_TOKEN_URL, {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({
			grant_type: "client_credentials",
			client_id: process.env.NAVIGRAPH_SERVER_CLIENT_ID ?? "",
			client_secret: process.env.NAVIGRAPH_SERVER_CLIENT_SECRET ?? "",
			scope: "fmsdata",
		}),
	});

	if (!response.ok) {
		throw new Error(`Failed to get Navigraph server token: ${response.status} ${await response.text()}`);
	}

	const data = (await response.json()) as { access_token: string };
	return data.access_token;
}

async function fetchPackage(token: string, status: "current" | "outdated"): Promise<NavigraphApiPackage> {
	const response = await fetch(`${NAVIGRAPH_PACKAGES_URL}?package_status=${status}`, {
		headers: { Authorization: `Bearer ${token}` },
	});

	if (!response.ok) {
		throw new Error(`Failed to fetch Navigraph packages (${status}): ${response.status} ${await response.text()}`);
	}

	const body = (await response.json()) as NavigraphApiPackage;
	return body;
}

async function withExtractedDb<T>(sevenZipBuffer: Buffer, callback: (db: Database.Database) => T): Promise<T> {
	const tempDir = await mkdtemp(join(tmpdir(), "navigraph-"));
	try {
		const inputPath = join(tempDir, "input.7z");
		const extractPath = join(tempDir, "extracted");
		await writeFile(inputPath, sevenZipBuffer);
		await mkdir(extractPath, { recursive: true });

		await new Promise<void>((resolve, reject) => {
			const stream = Seven.extractFull(inputPath, extractPath, { $bin: path7za });
			stream.on("end", resolve);
			stream.on("error", reject);
		});

		const files = await readdir(extractPath);
		const dbFile = files.find((f) => f.endsWith(".s3db"));
		if (!dbFile) throw new Error("No SQLite database found in Navigraph archive");

		const db = new Database(join(extractPath, dbFile), { readonly: true });
		try {
			return callback(db);
		} finally {
			db.close();
		}
	} finally {
		await rm(tempDir, { recursive: true, force: true });
	}
}

function queryNavaids(db: Database.Database): NavigraphNavaid[] {
	const seen = new Set<string>();
	const navaids: NavigraphNavaid[] = [];

	const tables: [string, NavigraphNavaid["type"]][] = [
		["tbl_d_vhfnavaids", "VOR"],
		["tbl_db_enroute_ndbnavaids", "NDB"],
		["tbl_pn_terminal_ndbnavaids", "NDB"],
	];

	for (const [table, type] of tables) {
		type NavaidRow = Omit<NavigraphNavaid, "type">;
		const rows = db
			.prepare(
				`SELECT navaid_identifier as id, area_code as areaCode, navaid_name as name,
				        navaid_latitude as latitude, navaid_longitude as longitude, navaid_frequency as frequency
				 FROM ${table}
				 WHERE navaid_latitude IS NOT NULL AND navaid_longitude IS NOT NULL`,
			)
			.all() as NavaidRow[];

		for (const row of rows) {
			const key = `${row.id}:${row.areaCode}`;
			if (!seen.has(key)) {
				seen.add(key);
				navaids.push({ ...row, type });
			}
		}
	}

	return navaids;
}

function queryWaypoints(db: Database.Database): NavigraphWaypoint[] {
	const seen = new Set<string>();
	const waypoints: NavigraphWaypoint[] = [];

	for (const table of ["tbl_ea_enroute_waypoints", "tbl_pc_terminal_waypoints"]) {
		const rows = db
			.prepare(
				`SELECT waypoint_identifier as id, area_code as areaCode, waypoint_name as name,
				        waypoint_latitude as latitude, waypoint_longitude as longitude
				 FROM ${table}
				 WHERE waypoint_latitude IS NOT NULL AND waypoint_longitude IS NOT NULL`,
			)
			.all() as NavigraphWaypoint[];

		for (const row of rows) {
			const key = `${row.id}:${row.areaCode}`;
			if (!seen.has(key)) {
				seen.add(key);
				waypoints.push(row);
			}
		}
	}

	return waypoints;
}

function queryAirways(db: Database.Database): NavigraphAirway[] {
	type AirwayRow = { id: string; areaCode: string; type: string; seqno: number; waypoint_identifier: string };
	const rows = db
		.prepare(
			`SELECT route_identifier as id, area_code as areaCode, route_type as type, seqno, waypoint_identifier
			 FROM tbl_er_enroute_airways
			 ORDER BY route_identifier, area_code, seqno`,
		)
		.all() as AirwayRow[];

	const airwayMap = new Map<string, NavigraphAirway>();
	for (const row of rows) {
		const key = `${row.id}:${row.areaCode}`;
		let entry = airwayMap.get(key);
		if (!entry) {
			entry = { id: row.id, areaCode: row.areaCode, type: row.type, waypoints: [] };
			airwayMap.set(key, entry);
		}
		if (row.waypoint_identifier) {
			entry.waypoints.push(row.waypoint_identifier);
		}
	}

	return [...airwayMap.values()];
}

function queryAirports(db: Database.Database): NavigraphAirport[] {
	type GateRow = { airport_identifier: string; id: string; latitude: number; longitude: number };
	const gateRows = db
		.prepare(
			`SELECT airport_identifier, gate_identifier as id, gate_latitude as latitude, gate_longitude as longitude
			 FROM tbl_pb_gates
			 WHERE gate_latitude IS NOT NULL AND gate_longitude IS NOT NULL`,
		)
		.all() as GateRow[];

	const gatesByAirport = new Map<string, { id: string; latitude: number; longitude: number }[]>();
	for (const gate of gateRows) {
		let list = gatesByAirport.get(gate.airport_identifier);
		if (!list) {
			list = [];
			gatesByAirport.set(gate.airport_identifier, list);
		}
		list.push({ id: gate.id, latitude: gate.latitude, longitude: gate.longitude });
	}

	return [...gatesByAirport.entries()].map(([id, gates]) => ({ id, gates }));
}

function queryProcedures(db: Database.Database, table: string): NavigraphSid[] {
	type ProcRow = { id: string; airportId: string; seqno: number; waypoint_identifier: string };
	const rows = db
		.prepare(
			`SELECT procedure_identifier as id, airport_identifier as airportId, seqno, waypoint_identifier
			 FROM ${table}
			 WHERE waypoint_identifier IS NOT NULL AND waypoint_identifier != ''
			 ORDER BY procedure_identifier, airport_identifier, seqno`,
		)
		.all() as ProcRow[];

	const procMap = new Map<string, NavigraphSid>();
	for (const row of rows) {
		const key = `${row.airportId}:${row.id}`;
		let entry = procMap.get(key);
		if (!entry) {
			entry = { id: row.id, airportId: row.airportId, waypoints: [] };
			procMap.set(key, entry);
		}
		entry.waypoints.push(row.waypoint_identifier);
	}

	return [...procMap.values()];
}

export async function updateNavigraphPackages(): Promise<void> {
	const token = await getServerToken();
	const packages = await Promise.all([fetchPackage(token, "current"), fetchPackage(token, "outdated")]);

	for (const pkg of packages.flat()) {
		const { cycle, package_status: packageStatus, package_id: packageId } = pkg;

		const existing = await rdsGetSingle(`navigraph:package:${packageStatus}`);
		if (existing?.cycle === cycle) {
			console.log(`⏭️  Navigraph package ${packageId} (${cycle}) already up to date`);
			continue;
		}

		const file = pkg.files[0];
		if (!file) continue;

		const fileResponse = await fetch(file.signed_url);
		if (!fileResponse.ok) {
			console.error(`Failed to download Navigraph file ${file.key}: ${fileResponse.status}`);
			continue;
		}

		const sevenZipBuffer = Buffer.from(await fileResponse.arrayBuffer());

		let dataset: NavigraphDataset;
		try {
			dataset = await withExtractedDb(sevenZipBuffer, (db) => ({
				navaids: queryNavaids(db),
				waypoints: queryWaypoints(db),
				airways: queryAirways(db),
				airports: queryAirports(db),
				sids: queryProcedures(db, "tbl_pd_sids"),
				stars: queryProcedures(db, "tbl_pe_stars"),
			}));
		} catch (err) {
			console.error(`Failed to extract/query Navigraph package ${packageId}:`, err);
			continue;
		}

		const r2Key = `navigraph/${cycle}/package.json`;
		await uploadToR2(r2Key, JSON.stringify(dataset));

		const stored: NavigraphPackage = {
			id: packageId,
			name: pkg.description,
			format: pkg.format,
			cycle,
			r2Key,
			package_status: packageStatus,
		};

		await rdsSetSingle(`navigraph:package:${packageStatus}`, stored);
		if (packageStatus === "current") {
			await rdsSetSingle("navigraph:data:current", dataset);
		}
		console.log(`✅ Navigraph package ${packageId} (${cycle}) [${packageStatus}] uploaded to R2`);
	}
}
