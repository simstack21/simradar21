import { rdsGetSingle } from "@sr24/db/redis";

let currentVatspyVersion: string | null = null;
let currentAirportsVersion: string | null = null;

let firPrefixes: Record<string, string> = {};
let airportPrefixes: Record<string, string> = {};
let traconPrefixes: Record<string, string> = {};

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

		currentVatspyVersion = vatspyVersion;
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
