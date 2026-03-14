import { rdsGetSingle, rdsSetSingle } from "@sr24/db/redis";
import type { VatglassesDataset } from "@sr24/types/db";
import axios from "axios";

const COMMITS_URL = "https://api.github.com/repos/lennycolton/vatglasses-data/commits?path=data&per_page=1";
const RAW_BASE = "https://raw.githubusercontent.com/lennycolton/vatglasses-data/main/data";
const CONTENTS_BASE = "https://api.github.com/repos/lennycolton/vatglasses-data/contents/data";

interface ContentsEntry {
	name: string;
	type: "file" | "dir";
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

async function fetchContentsIndex(): Promise<ContentsEntry[]> {
	const res = await axios.get<ContentsEntry[]>(CONTENTS_BASE);
	return res.data;
}

async function fetchStaticDataset(code: string): Promise<VatglassesDataset | null> {
	try {
		const res = await axios.get(`${RAW_BASE}/${code}.json`);
		const raw = res.data;

		if (!Array.isArray(raw.airspace)) return null;

		return {
			code,
			airspace: raw.airspace,
			positions: raw.positions ?? {},
			groups: raw.groups ?? {},
			airports: raw.airports ?? {},
		};
	} catch {
		return null;
	}
}

async function fetchDynamicDataset(code: string): Promise<VatglassesDataset | null> {
	try {
		const [airspaceRes, positionsRes, ownershipRes] = await Promise.all([
			axios.get(`${RAW_BASE}/${code}/airspace.json`),
			axios.get(`${RAW_BASE}/${code}/positions.json`),
			axios.get(`${RAW_BASE}/${code}/ownership/default.json`),
		]);

		const rawAirspace = airspaceRes.data;
		const rawPositions = positionsRes.data;
		const rawOwnership = ownershipRes.data;

		const airspace = Object.entries(rawAirspace.airspace).map(([sectorId, entry]: [string, any]) => ({
			key: sectorId,
			id: entry.id,
			group: entry.group,
			owner: rawOwnership.airspace[sectorId] ?? [],
			sectors: entry.sectors,
		}));

		return {
			code,
			airspace,
			positions: rawPositions.positions ?? {},
			groups: rawAirspace.groups ?? {},
			airports: rawAirspace.airports ?? {},
		};
	} catch {
		return null;
	}
}
