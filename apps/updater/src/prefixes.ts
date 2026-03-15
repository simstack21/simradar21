import { rdsGetSingle, rdsSetSingle } from "@sr24/db/redis";
import type { SimAwareTraconFeature, TraconPrefix, VatSpyAirport, VatSpyFir, VatSpyUir } from "@sr24/types/db";
import axios from "axios";

const RELEASE_URL = "https://api.github.com/repos/vatsimnetwork/vatspy-data-project/releases/latest";
const BASE_DATA_URL = "https://github.com/vatsimnetwork/vatspy-data-project/releases/download/";

let version: string | null = null;

export async function updatePrefixes(): Promise<void> {
	if (!version) {
		await initVersion();
	}
	if (!(await isNewRelease())) return;

	try {
		const vatSpyDatUrl = `${BASE_DATA_URL}${version}/VATSpy.dat`;

		const vatSpyResponse = await axios.get(vatSpyDatUrl, {
			responseType: "text",
		});
		const vatSpyDat = vatSpyResponse.data;
		if (!vatSpyDat) return;

		const firs = extractFirs(vatSpyDat);
		storeFirPrefixes(firs);

		const airports = extractAirports(vatSpyDat);
		storeTraconPrefixes(airports);

		const uirs = extractUirs(vatSpyDat);
		storeUirPrefixes(uirs);

		await rdsSetSingle("vatspy:version", version || "1.0.0");

		console.log(`✅ Prefix data updated to version ${version}`);
	} catch (error) {
		console.error(`Error checking for new prefix data: ${error}`);
	}
}

async function initVersion(): Promise<void> {
	if (!version) {
		const redisVersion = await rdsGetSingle("vatspy:version");
		version = redisVersion || "0.0.0";
	}
}

async function isNewRelease(): Promise<boolean> {
	try {
		const response = await axios.get(RELEASE_URL);
		const release = response.data.tag_name;

		if (release !== version) {
			version = release;
			return true;
		}
	} catch (error) {
		console.error(`Error checking for updates: ${error}`);
	}

	return false;
}

export function extractFirs(vatSpyDat: string): VatSpyFir[] {
	const firs: VatSpyFir[] = [];

	const sectionStart = vatSpyDat.indexOf("[FIRs]");
	if (sectionStart === -1) return [];

	const lines = vatSpyDat.slice(sectionStart).split("\r\n");

	for (let line of lines) {
		line = line.trim();

		if (line === "") break;
		if (line.startsWith(";") || line.startsWith("[FIRs]")) continue;

		const [icao, name, callsign_prefix, fir_bound] = line.split("|");
		firs.push({
			icao,
			name,
			callsign_prefix,
			fir_bound,
		});
	}

	return firs;
}

function extractAirports(vatSpyDat: string): VatSpyAirport[] {
	const airports: VatSpyAirport[] = [];

	const sectionStart = vatSpyDat.indexOf("[Airports]");
	if (sectionStart === -1) return [];

	const lines = vatSpyDat.slice(sectionStart).split("\r\n");

	for (let line of lines) {
		line = line.trim();

		if (line === "") break;
		if (line.startsWith(";") || line.startsWith("[Airports]")) continue;

		const [icao, name, latitude, longitude, lid, fir, isPsuedo] = line.split("|");
		airports.push({
			icao,
			name,
			latitude: parseFloat(latitude),
			longitude: parseFloat(longitude),
			lid,
			fir,
			isPsuedo: isPsuedo === "1",
		});
	}

	return airports;
}

function extractUirs(vatSpyDat: string): VatSpyUir[] {
	const uirs: VatSpyUir[] = [];

	const sectionStart = vatSpyDat.indexOf("[UIRs]");
	if (sectionStart === -1) return [];

	const lines = vatSpyDat.slice(sectionStart).split("\r\n");

	for (let line of lines) {
		line = line.trim();

		if (line === "") break;
		if (line.startsWith(";") || line.startsWith("[UIRs]")) continue;

		const [callsign_prefix, name, firs] = line.split("|");
		uirs.push({
			callsign_prefix,
			name,
			firs: firs ? firs.split(",") : [],
		});
	}

	return uirs;
}

async function storeFirPrefixes(firs: VatSpyFir[]): Promise<void> {
	const prefixes: Record<string, string> = {};
	for (const fir of firs) {
		prefixes[fir.callsign_prefix || fir.fir_bound] = fir.fir_bound;
	}
	for (const fir of firs) {
		if (!prefixes[fir.icao] && !fir.fir_bound.includes("-")) {
			prefixes[fir.icao] = fir.fir_bound;
		}
	}
	await rdsSetSingle("static_firs:prefixes", prefixes);
}

async function storeTraconPrefixes(airports: VatSpyAirport[]): Promise<void> {
	const prefixes: Record<string, TraconPrefix> = {};

	for (const airport of airports) {
		prefixes[airport.lid] = { prefix: airport.icao, countryCode: airport.icao.slice(0, 2) };
	}

	const features = (await rdsGetSingle("static_tracons:all")) as SimAwareTraconFeature[] | undefined;
	if (!features) {
		await rdsSetSingle("static_tracons:prefixes", prefixes);
		return;
	}

	features.forEach((f) => {
		const featurePrefixes = f.properties.prefix;

		if (typeof featurePrefixes === "string") {
			const existing = prefixes[featurePrefixes];
			if (existing) {
				existing.prefix = featurePrefixes;
			} else {
				prefixes[featurePrefixes] = { prefix: featurePrefixes, countryCode: featurePrefixes.slice(0, 2) };
			}
		} else {
			const joined = featurePrefixes.join(":");
			const existing = prefixes[joined];
			if (existing) {
				existing.prefix = joined;
			} else {
				prefixes[joined] = { prefix: joined, countryCode: joined.slice(0, 2) };
			}
		}
	});

	await rdsSetSingle("static_tracons:prefixes", prefixes);
}

async function storeUirPrefixes(uirs: VatSpyUir[]): Promise<void> {
	const prefixes: Record<string, string[]> = {};
	for (const uir of uirs) {
		prefixes[uir.callsign_prefix] = uir.firs;
	}
	await rdsSetSingle("static_uirs:prefixes", prefixes);
}
