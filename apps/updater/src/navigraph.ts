import { mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { rdsGetSingle, rdsSetSingle } from "@sr24/db/redis";
import type { NavigraphPackage } from "@sr24/types/db";
import type { NavigraphAirport, NavigraphAirway, NavigraphDataset, NavigraphProcedure, NavigraphWaypoint } from "@sr24/types/navigraph";
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

function queryNavaids(db: Database.Database): NavigraphWaypoint[] {
	const seen = new Set<string>();
	const navaids: NavigraphWaypoint[] = [];

	type NavaidRow = {
		id: string;
		areaCode: string;
		icaoCode: string;
		name: string;
		latitude: number;
		longitude: number;
		frequency: number;
		class: string;
	};

	const vorRows = db
		.prepare(
			`SELECT navaid_identifier as id,
			        area_code as areaCode,
			        icao_code as icaoCode,
			        navaid_name as name,
			        COALESCE(navaid_latitude, dme_latitude) as latitude,
			        COALESCE(navaid_longitude, dme_longitude) as longitude,
			        navaid_frequency as frequency,
                    navaid_class as class
			 FROM tbl_d_vhfnavaids
			 WHERE COALESCE(navaid_latitude, dme_latitude) IS NOT NULL
			   AND COALESCE(navaid_longitude, dme_longitude) IS NOT NULL`,
		)
		.all() as NavaidRow[];

	for (const row of vorRows) {
		const uid = `${row.areaCode}:${row.icaoCode}:${row.id}`;
		if (!seen.has(uid)) {
			seen.add(uid);
			navaids.push({
				uid,
				id: row.id,
				name: row.name,
				latitude: row.latitude,
				longitude: row.longitude,
				class: parseNavaidClass(row.class),
				frequency: row.frequency,
			});
		}
	}

	for (const table of ["tbl_db_enroute_ndbnavaids", "tbl_pn_terminal_ndbnavaids"]) {
		const rows = db
			.prepare(
				`SELECT navaid_identifier as id, area_code as areaCode, icao_code as icaoCode, navaid_name as name,
				        navaid_latitude as latitude, navaid_longitude as longitude, navaid_frequency as frequency, navaid_class as class
				 FROM ${table}
				 WHERE navaid_latitude IS NOT NULL AND navaid_longitude IS NOT NULL`,
			)
			.all() as NavaidRow[];

		for (const row of rows) {
			const uid = `${row.areaCode}:${row.icaoCode}:${row.id}`;
			if (!seen.has(uid)) {
				seen.add(uid);
				navaids.push({
					uid,
					id: row.id,
					name: row.name,
					latitude: row.latitude,
					longitude: row.longitude,
					class: parseNavaidClass(row.class),
					frequency: row.frequency,
				});
			}
		}
	}

	return navaids;
}

function queryWaypoints(db: Database.Database): NavigraphWaypoint[] {
	const seen = new Set<string>();
	const waypoints: NavigraphWaypoint[] = [];

	type WaypointRow = { id: string; areaCode: string; icaoCode: string; name: string; latitude: number; longitude: number };

	for (const table of ["tbl_ea_enroute_waypoints", "tbl_pc_terminal_waypoints"]) {
		const rows = db
			.prepare(
				`SELECT waypoint_identifier as id, area_code as areaCode, icao_code as icaoCode, waypoint_name as name,
				        waypoint_latitude as latitude, waypoint_longitude as longitude
				 FROM ${table}
				 WHERE waypoint_latitude IS NOT NULL AND waypoint_longitude IS NOT NULL`,
			)
			.all() as WaypointRow[];

		for (const row of rows) {
			const uid = `${row.areaCode}:${row.icaoCode}:${row.id}`;
			if (!seen.has(uid)) {
				seen.add(uid);
				waypoints.push({ uid, id: row.id, name: row.name, latitude: row.latitude, longitude: row.longitude, class: "WPT" });
			}
		}
	}

	return waypoints;
}

function queryAirways(db: Database.Database): NavigraphAirway[] {
	type AirwayRow = {
		id: string;
		areaCode: string;
		icaoCode: string;
		type: string;
		seqno: number;
		waypointId: string;
		inboundCourse: number;
		inboundDistance: number;
	};
	const rows = db
		.prepare(
			`SELECT route_identifier as id, area_code as areaCode, icao_code as icaoCode, route_type as type, seqno,
			        waypoint_identifier as waypointId, inbound_course as inboundCourse, inbound_distance as inboundDistance
			 FROM tbl_er_enroute_airways
			 ORDER BY route_identifier, area_code, seqno`,
		)
		.all() as AirwayRow[];

	const airways: NavigraphAirway[] = [];
	let current: { id: string; type: string; waypoints: string[] } | null = null;

	for (const row of rows) {
		if (!row.waypointId) continue;

		const waypointUid = `${row.areaCode}:${row.icaoCode}:${row.waypointId}`;

		if (row.inboundCourse === 0) {
			if (current && current.waypoints.length >= 2) {
				const entryUid = current.waypoints[0];
				const exitUid = current.waypoints[current.waypoints.length - 1];
				airways.push({ uid: `${entryUid}:${current.id}:${exitUid}`, id: current.id, type: current.type, waypoints: current.waypoints });
			}
			current = { id: row.id, type: row.type, waypoints: [waypointUid] };
		} else if (current) {
			current.waypoints.push(waypointUid);
		}

		if (row.inboundDistance === 0 && current && current.waypoints.length >= 2) {
			const entryUid = current.waypoints[0];
			const exitUid = current.waypoints[current.waypoints.length - 1];
			airways.push({ uid: `${entryUid}:${current.id}:${exitUid}`, id: current.id, type: current.type, waypoints: current.waypoints });
			current = null;
		}
	}

	return airways;
}

function queryAirports(db: Database.Database): NavigraphAirport[] {
	type AirportRow = { id: string; latitude: number; longitude: number };
	const airportRows = db
		.prepare(
			`SELECT airport_identifier as id, airport_ref_latitude as latitude, airport_ref_longitude as longitude
			 FROM tbl_pa_airports
			 WHERE airport_ref_latitude IS NOT NULL AND airport_ref_longitude IS NOT NULL`,
		)
		.all() as AirportRow[];

	const airportMap = new Map<string, NavigraphAirport>();
	for (const row of airportRows) {
		airportMap.set(row.id, { id: row.id, latitude: row.latitude, longitude: row.longitude, gates: [], runways: [], sids: [], stars: [] });
	}

	type GateRow = { airport_identifier: string; id: string; latitude: number; longitude: number };
	const gateRows = db
		.prepare(
			`SELECT airport_identifier, gate_identifier as id, gate_latitude as latitude, gate_longitude as longitude
			 FROM tbl_pb_gates
			 WHERE gate_latitude IS NOT NULL AND gate_longitude IS NOT NULL`,
		)
		.all() as GateRow[];

	for (const gate of gateRows) {
		const airport = airportMap.get(gate.airport_identifier);
		if (airport) {
			airport.gates.push({ id: gate.id, latitude: gate.latitude, longitude: gate.longitude });
		}
	}

	type RunwayRow = { airport_identifier: string; id: string; latitude: number; longitude: number };
	const runwayRows = db
		.prepare(
			`SELECT airport_identifier, runway_identifier as id, runway_latitude as latitude, runway_longitude as longitude
			 FROM tbl_pg_runways
			 WHERE runway_latitude IS NOT NULL AND runway_longitude IS NOT NULL`,
		)
		.all() as RunwayRow[];

	for (const runway of runwayRows) {
		const airport = airportMap.get(runway.airport_identifier);
		if (airport) {
			airport.runways.push({ id: runway.id, latitude: runway.latitude, longitude: runway.longitude });
		}
	}

	type ProcRow = {
		id: string;
		airportId: string;
		seqno: number;
		transitionId: string | null;
		waypointId: string;
		waypointIcaoCode: string;
		areaCode: string;
	};

	for (const [table, key] of [
		["tbl_pd_sids", "sids"],
		["tbl_pe_stars", "stars"],
	] as const) {
		const rows = db
			.prepare(
				`SELECT procedure_identifier as id, airport_identifier as airportId, seqno, transition_identifier as transitionId,
				        waypoint_identifier as waypointId, waypoint_icao_code as waypointIcaoCode, area_code as areaCode
				 FROM ${table}
				 WHERE waypoint_identifier IS NOT NULL AND waypoint_identifier != ''
				   AND waypoint_latitude IS NOT NULL AND waypoint_longitude IS NOT NULL
				 ORDER BY procedure_identifier, airport_identifier, seqno`,
			)
			.all() as ProcRow[];

		const procMap = new Map<string, NavigraphProcedure>();
		for (const row of rows) {
			const airport = airportMap.get(row.airportId);
			if (!airport) continue;

			const uid = `${row.airportId}:${row.id}:${row.transitionId || "ALL"}`;
			let proc = procMap.get(uid);
			if (!proc) {
				proc = { uid, id: row.id, waypoints: [] };
				procMap.set(uid, proc);
				airport[key].push(proc);
			}
			proc.waypoints.push(`${row.areaCode}:${row.waypointIcaoCode}:${row.waypointId}`);
		}
	}

	return [...airportMap.values()];
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
				waypoints: [...queryWaypoints(db), ...queryNavaids(db)],
				airways: queryAirways(db),
				airports: queryAirports(db),
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

function parseNavaidClass(navaidClass: string): "VOR" | "DME" | "VORDME" | "TACAN" | "NDB" | "WPT" {
	if (navaidClass.startsWith("VD")) return "VORDME";
	if (navaidClass.startsWith("V")) return "VOR";
	if (navaidClass.startsWith(" D")) return "DME";
	if (navaidClass.startsWith(" T") || navaidClass.startsWith(" M")) return "TACAN";
	if (navaidClass.startsWith("H")) return "NDB";
	return "WPT";
}
