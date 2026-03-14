import { rdsGetSingle } from "@sr24/db/redis";
import type { SimAwareTraconFeature } from "@sr24/types/db";

let currentFirsVersion: string | null = null;
let currentTraconsVersion: string | null = null;
let currentAirportsVersion: string | null = null;

let firPrefixes: Record<string, string> = {};
let airportPrefixes: Record<string, string> = {};
const traconPrefixes = new Map<string, string>();

export async function ensureSectorPrefixes(): Promise<void> {
	const firsVersion = await rdsGetSingle("static_firs:version");
	const traconsVersion = await rdsGetSingle("static_tracons:version");
	const airportVersion = await rdsGetSingle("static_airports:version");

	if (currentFirsVersion !== firsVersion) {
		const prefixes = (await rdsGetSingle("static_firs:prefixes")) as Record<string, string> | undefined;
		if (prefixes) {
			firPrefixes = prefixes;
			currentFirsVersion = firsVersion;
		}
	}

	if (currentTraconsVersion !== traconsVersion) {
		const features = (await rdsGetSingle("static_tracons:all")) as SimAwareTraconFeature[] | undefined;
		if (features) {
			traconPrefixes.clear();
			features.forEach((f) => {
				const prefixes = f.properties.prefix;

				if (typeof prefixes === "string") {
					traconPrefixes.set(prefixes, f.properties.id);
				} else {
					prefixes.forEach((prefix) => {
						traconPrefixes.set(prefix, f.properties.id);
					});
				}
			});

			currentTraconsVersion = traconsVersion;
		}
	}

	if (currentAirportsVersion !== airportVersion) {
		const prefixes = (await rdsGetSingle("static_airports:prefixes")) as Record<string, string> | undefined;
		if (prefixes) {
			airportPrefixes = prefixes;
			currentAirportsVersion = airportVersion;
		}
	}
}

export function reduceCallsign(callsign: string): string[] {
	const parts = callsign.split(/__|_/);
	const levels: string[] = [];

	for (let i = parts.length; i > 0; i--) {
		levels.push(parts.slice(0, i).join("_"));
	}

	return levels;
}

export function findTraconId(callsign: string): string | null {
	let bestMatch: string | null = null;
	let bestLen = 0;

	for (const [prefix, id] of traconPrefixes) {
		if (callsign.startsWith(prefix) && prefix.length > bestLen) {
			bestMatch = id;
			bestLen = prefix.length;
		}
	}

	return bestMatch;
}

export function findFirId(callsign: string): string | null {
	let bestMatch: string | null = null;
	let bestLen = 0;

	for (const prefix in firPrefixes) {
		if (callsign.startsWith(prefix) && prefix.length > bestLen) {
			bestMatch = firPrefixes[prefix];
			bestLen = prefix.length;
		}
	}

	return bestMatch;
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
