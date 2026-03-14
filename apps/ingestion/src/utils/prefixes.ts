import { rdsGetSingle } from "@sr24/db/redis";
import type { VatglassesDataset } from "@sr24/types/db";

let currentVatspyVersion: string | null = null;
let currentAirportsVersion: string | null = null;
let currentVatglassesSha: string | null = null;

let firPrefixes: Record<string, string> = {};
let airportPrefixes: Record<string, string> = {};
let uirPrefixes: Record<string, string[]> = {};
let traconPrefixes: Record<string, string> = {};

// index: 2-char / 3-char / full code / hyphen-split segment → dataset
const vatglassesIndex = new Map<string, VatglassesDataset>();

export async function ensureSectorPrefixes(): Promise<void> {
	const vatspyVersion = await rdsGetSingle("vatspy:version");
	const airportVersion = await rdsGetSingle("static_airports:version");

	if (vatspyVersion !== currentVatspyVersion) {
		const newFirPrefixes = (await rdsGetSingle("static_firs:prefixes")) as Record<string, string> | undefined;
		if (newFirPrefixes) {
			firPrefixes = newFirPrefixes;
		}

		const newTraconPrefixes = (await rdsGetSingle("static_tracons:prefixes")) as Record<string, string> | undefined;
		if (newTraconPrefixes) {
			traconPrefixes = newTraconPrefixes;
		}

		const newUirPrefixes = (await rdsGetSingle("static_uirs:prefixes")) as Record<string, string[]> | undefined;
		if (newUirPrefixes) {
			uirPrefixes = newUirPrefixes;
		}

		currentVatspyVersion = vatspyVersion;
	}

	if (currentAirportsVersion !== airportVersion) {
		const prefixes = (await rdsGetSingle("static_airports:prefixes")) as Record<string, string> | undefined;
		if (prefixes) {
			airportPrefixes = prefixes;
			currentAirportsVersion = airportVersion;
		}
	}

	const vatglassesSha = await rdsGetSingle("static_vatglasses:sha");
	if (vatglassesSha !== currentVatglassesSha) {
		const datasets = (await rdsGetSingle("static_vatglasses:all")) as VatglassesDataset[] | undefined;
		if (datasets) {
			vatglassesIndex.clear();

			for (const dataset of datasets) {
				const parts = dataset.code.split("-");
				for (const part of parts) {
					if (!vatglassesIndex.has(part)) vatglassesIndex.set(part, dataset);
				}
				vatglassesIndex.set(dataset.code, dataset);
			}

			currentVatglassesSha = vatglassesSha;
		}
	}
}

function resolveVatglassesDataset(code: string): VatglassesDataset | null {
	const lower = code.toLowerCase();
	return vatglassesIndex.get(lower.slice(0, 2)) ?? vatglassesIndex.get(lower.slice(1, 4)) ?? vatglassesIndex.get(lower) ?? null;
}

export function resolveVatglassesPos(callsign: string, frequency: number, mergedId: string): { datasetId: string; posId: string } | null {
	const code = mergedId.replace(/^[^_]+_/, "");
	const dataset = resolveVatglassesDataset(code);
	if (!dataset) return null;

	for (const [posId, pos] of Object.entries(dataset.positions)) {
		if (pos.frequency && Math.round(parseFloat(pos.frequency) * 1000) !== frequency) continue;
		if (!callsign.endsWith(pos.type)) continue;

		const pre = Array.isArray(pos.pre) ? pos.pre : pos.pre ? [pos.pre] : [];
		if (pre.length && !pre.some((p) => callsign.startsWith(p))) continue;

		return { datasetId: dataset.code, posId };
	}

	return null;
}

export function reduceCallsign(callsign: string): string[] {
	const parts = callsign.split(/__|_/);
	const levels: string[] = [];

	for (let i = parts.length; i > 0; i--) {
		levels.push(parts.slice(0, i).join("_"));
	}

	return levels;
}

function matchesPrefix(callsign: string, prefix: string): boolean {
	return callsign === prefix || callsign.startsWith(`${prefix}_`);
}

export function findTraconId(callsign: string): string | null {
	let bestMatch: string | null = null;
	let bestLen = 0;

	for (const prefix in traconPrefixes) {
		if (matchesPrefix(callsign, prefix) && prefix.length > bestLen) {
			bestMatch = traconPrefixes[prefix];
			bestLen = prefix.length;
		}
	}

	return bestMatch;
}

export function findFirId(callsign: string): string | null {
	let bestMatch: string | null = null;
	let bestLen = 0;

	for (const prefix in firPrefixes) {
		if (matchesPrefix(callsign, prefix) && prefix.length > bestLen) {
			bestMatch = firPrefixes[prefix];
			bestLen = prefix.length;
		}
	}

	return bestMatch;
}

export function findFirsByUir(callsign: string): string[] {
	for (const uirPrefix in uirPrefixes) {
		if (matchesPrefix(callsign, uirPrefix)) {
			return uirPrefixes[uirPrefix];
		}
	}
	return [];
}

export function findAirportId(id: string): string | null {
	return airportPrefixes[id] || id;
}

export function parseAirportFacility(callsign: string): number {
	// GND, DEL, TWR
	const suffix = callsign.split("_").pop()?.toUpperCase();
	switch (suffix) {
		case "TWR":
			return 4;
		case "GND":
			return 3;
		case "DEL":
			return 2;
		default:
			return 4;
	}
}
