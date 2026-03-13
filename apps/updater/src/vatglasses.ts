import { rdsGetSingle, rdsSetSingle } from "@sr24/db/redis";
import type { VatglassesAirspaceEntry, VatglassesDataset, VatglassesGroup, VatglassesPosition, VatglassesSector } from "@sr24/types/db";
import axios from "axios";

const COMMITS_URL = "https://api.github.com/repos/lennycolton/vatglasses-data/commits?path=data&per_page=1";
const RAW_BASE = "https://raw.githubusercontent.com/lennycolton/vatglasses-data/main/data";
const CONTENTS_BASE = "https://api.github.com/repos/lennycolton/vatglasses-data/contents/data";

interface RawSector {
	min?: number;
	max?: number;
	points: [string, string][];
	runways?: { icao: string; runway: string[] }[];
}

interface RawStaticAirspaceEntry {
	id: string;
	group: string;
	owner: string[];
	sectors: RawSector[];
}

interface RawStaticFile {
	airspace: RawStaticAirspaceEntry[];
	positions: Record<string, RawPosition>;
	groups: Record<string, { name: string; colour?: string; color?: string }>;
	airports?: Record<string, RawAirport>;
	callsigns?: unknown;
}

interface RawDynamicAirspaceEntry {
	id: string;
	group: string;
	sectors: RawSector[];
}

interface RawDynamicAirspaceFile {
	airspace: Record<string, RawDynamicAirspaceEntry>;
	groups: Record<string, { name: string; colour?: string; color?: string }>;
	airports?: Record<string, RawAirport>;
}

interface RawDynamicPositionsFile {
	positions: Record<string, RawPosition>;
	callsigns?: unknown;
}

interface RawOwnershipFile {
	airspace: Record<string, string[]>;
}

interface RawPosition {
	pre: string[];
	type: string;
	frequency: string;
	callsign?: string;
	colours?: { hex: string; online?: string[] }[];
}

interface RawAirport {
	callsign?: string;
	coord?: [string, string];
	topdown?: string[];
}

let sha: string | null = null;

export async function updateVatglasses(): Promise<void> {
	if (!sha) {
		sha = (await rdsGetSingle("static_vatglasses:sha")) || null;
	}

	const latestSha = await fetchLatestSha();
	if (!latestSha || latestSha === sha) return;

	try {
		const contents = await fetchContentsIndex();
		const datasets: VatglassesDataset[] = [];

		for (const entry of contents) {
			if (entry.type === "file" && entry.name.endsWith(".json") && entry.name !== "nodata.json" && entry.name !== "fss.json") {
				const code = entry.name.replace(".json", "");
				const dataset = await fetchStaticDataset(code);
				if (dataset) datasets.push(dataset);
			} else if (entry.type === "dir") {
				const dataset = await fetchDynamicDataset(entry.name);
				if (dataset) datasets.push(dataset);
			}
		}

		await rdsSetSingle("static_vatglasses:all", datasets);
		await rdsSetSingle("static_vatglasses:sha", latestSha);
		sha = latestSha;

		console.log(`✅ VATGlasses data updated to ${latestSha.slice(0, 7)} (${datasets.length} datasets)`);
	} catch (error) {
		console.error("Error updating VATGlasses data:", error);
	}
}

async function fetchLatestSha(): Promise<string | null> {
	try {
		const res = await axios.get<{ sha: string }[]>(COMMITS_URL);
		return res.data[0]?.sha ?? null;
	} catch {
		return null;
	}
}

interface ContentsEntry {
	name: string;
	type: "file" | "dir";
}

async function fetchContentsIndex(): Promise<ContentsEntry[]> {
	const res = await axios.get<ContentsEntry[]>(CONTENTS_BASE);
	return res.data;
}

async function fetchStaticDataset(code: string): Promise<VatglassesDataset | null> {
	try {
		const res = await axios.get<RawStaticFile>(`${RAW_BASE}/${code}.json`);
		const raw = res.data;

		if (!Array.isArray(raw.airspace)) return null;

		return {
			code,
			airspace: raw.airspace.map(normaliseStaticEntry),
			positions: normalisePositions(raw.positions),
			groups: normaliseGroups(raw.groups),
		};
	} catch {
		return null;
	}
}

async function fetchDynamicDataset(code: string): Promise<VatglassesDataset | null> {
	try {
		const [airspaceRes, positionsRes, ownershipRes] = await Promise.all([
			axios.get<RawDynamicAirspaceFile>(`${RAW_BASE}/${code}/airspace.json`),
			axios.get<RawDynamicPositionsFile>(`${RAW_BASE}/${code}/positions.json`),
			axios.get<RawOwnershipFile>(`${RAW_BASE}/${code}/ownership/default.json`),
		]);

		const rawAirspace = airspaceRes.data;
		const rawPositions = positionsRes.data;
		const rawOwnership = ownershipRes.data;

		const airspace: VatglassesAirspaceEntry[] = Object.entries(rawAirspace.airspace).map(([sectorId, entry]) => ({
			id: entry.id,
			group: entry.group,
			owner: rawOwnership.airspace[sectorId] ?? [],
			sectors: entry.sectors.map(normaliseSector),
		}));

		return {
			code,
			airspace,
			positions: normalisePositions(rawPositions.positions),
			groups: normaliseGroups(rawAirspace.groups),
		};
	} catch {
		return null;
	}
}

function normaliseStaticEntry(entry: RawStaticAirspaceEntry): VatglassesAirspaceEntry {
	return {
		id: entry.id,
		group: entry.group,
		owner: entry.owner,
		sectors: entry.sectors.map(normaliseSector),
	};
}

function normaliseSector(s: RawSector): VatglassesSector {
	return {
		points: s.points.map(parseDmsPoint),
		...(s.min !== undefined && { min: s.min }),
		...(s.max !== undefined && { max: s.max }),
		...(s.runways && { runways: s.runways }),
	};
}

function normalisePositions(raw: Record<string, RawPosition> = {}): Record<string, VatglassesPosition> {
	const out: Record<string, VatglassesPosition> = {};
	for (const [id, p] of Object.entries(raw)) {
		out[id] = {
			pre: p.pre,
			type: p.type,
			frequency: p.frequency,
			...(p.callsign && { callsign: p.callsign }),
			...(p.colours?.[0]?.hex && { colour: p.colours[0].hex }),
		};
	}
	return out;
}

function normaliseGroups(raw: Record<string, { name: string; colour?: string; color?: string }> = {}): Record<string, VatglassesGroup> {
	const out: Record<string, VatglassesGroup> = {};
	for (const [id, g] of Object.entries(raw)) {
		out[id] = { name: g.name, colour: g.colour ?? g.color ?? "#888888" };
	}
	return out;
}

function parseDms(dms: string): number {
	const neg = dms.startsWith("-");
	const abs = neg ? dms.slice(1) : dms;

	const padded = abs.padStart(7, "0");
	const ss = Number(padded.slice(-2));
	const mm = Number(padded.slice(-4, -2));
	const dd = Number(padded.slice(0, -4));

	const decimal = dd + mm / 60 + ss / 3600;
	return Math.round((neg ? -decimal : decimal) * 10000) / 10000;
}

function parseDmsPoint([lat, lon]: [string, string]): [number, number] {
	return [parseDms(lon), parseDms(lat)];
}
