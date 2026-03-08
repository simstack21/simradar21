import type { FIRFeature, SimAwareTraconFeature, StaticAircraftType, StaticAirline, StaticAirport } from "@sr24/types/db";
import type { NavigraphAirport, NavigraphAirway, NavigraphApproach, NavigraphProcedure, NavigraphWaypoint } from "@sr24/types/navigraph";
import Dexie, { type EntityTable } from "dexie";
import type { StatusSetter } from "@/hooks/useInitializer";
import { fetchApi } from "@/lib/api";
import { ensureNavigraphData } from "./navigraph";

interface DatabaseVersions {
	airportsVersion: string;
	traconsVersion: string;
	firsVersion: string;
	airlinesVersion: string;
	aircraftsVersion: string;
	navigraphCycle?: string;
}

interface DexieFeature {
	id: string;
	feature: FIRFeature | SimAwareTraconFeature;
}

type Manifest = { key: string; versions: DatabaseVersions };

const R2_BUCKET_URL = process.env.NODE_ENV === "development" ? process.env.NEXT_PUBLIC_R2_BUCKET_URL_DEV : process.env.NEXT_PUBLIC_R2_BUCKET_URL;

const db = new Dexie("StaticDatabase") as Dexie & {
	airports: EntityTable<StaticAirport, "id">;
	firs: EntityTable<DexieFeature, "id">;
	tracons: EntityTable<DexieFeature, "id">;
	airlines: EntityTable<StaticAirline, "id">;
	aircrafts: EntityTable<StaticAircraftType, "icao">;
	manifest: EntityTable<Manifest, "key">;
	ngWaypoints: EntityTable<NavigraphWaypoint, "uid">;
	ngAirways: EntityTable<NavigraphAirway, "uid">;
	ngAirports: EntityTable<NavigraphAirport, "id">;
};

db.version(1).stores({
	airports: "id",
	firs: "id",
	tracons: "id",
	airlines: "id",
	aircrafts: "icao",
	manifest: "key",
	ngWaypoints: "uid",
	ngAirways: "uid",
	ngAirports: "id",
});

let initPromise: Promise<void> | null = null;

export function dxEnsureInitialized(setStatus?: StatusSetter): Promise<void> {
	if (!initPromise) {
		initPromise = dxInitDatabases(setStatus).catch((err) => {
			initPromise = null;
			throw err;
		});
	}
	return initPromise;
}

export function dxDatabaseIsStale(): boolean {
	const lastCheck = localStorage.getItem("simradar21-db");
	const now = Date.now();
	if (lastCheck && now - parseInt(lastCheck, 10) < 30 * 60 * 1000) {
		return false;
	}
	return true;
}

async function dxInitDatabases(setStatus?: StatusSetter): Promise<void> {
	const latestManifest = await fetchApi<DatabaseVersions>("/data/static/versions");
	const storedManifest = (await db.manifest.get("databaseVersions")) as Manifest | undefined;

	if (latestManifest.airportsVersion !== storedManifest?.versions.airportsVersion) {
		const entries = (await fetchApi<StaticAirport[]>(`${R2_BUCKET_URL}/airports_${latestManifest.airportsVersion}.json`, {
			cache: "no-store",
		})) as StaticAirport[];
		storeData(entries, db.airports as EntityTable<any, "id">);
	}
	setStatus?.((prev) => ({ ...prev, airports: true }));

	if (latestManifest.firsVersion !== storedManifest?.versions.firsVersion) {
		const features = (await fetchApi<FIRFeature[]>(`${R2_BUCKET_URL}/firs_${latestManifest.firsVersion}.json`, {
			cache: "no-store",
		})) as FIRFeature[];
		const entries: DexieFeature[] = features.map((f) => ({
			id: f.properties.id,
			feature: f,
		}));

		storeData(entries, db.firs as EntityTable<any, "id">);
	}
	setStatus?.((prev) => ({ ...prev, firs: true }));

	if (latestManifest.traconsVersion !== storedManifest?.versions.traconsVersion) {
		const features = (await fetchApi<SimAwareTraconFeature[]>(`${R2_BUCKET_URL}/tracons_${latestManifest.traconsVersion}.json`, {
			cache: "no-store",
		})) as SimAwareTraconFeature[];
		const entries: DexieFeature[] = features.map((f) => ({
			id: f.properties.id,
			feature: f,
		}));

		storeData(entries, db.tracons as EntityTable<any, "id">);
	}
	setStatus?.((prev) => ({ ...prev, tracons: true }));

	if (latestManifest.airlinesVersion !== storedManifest?.versions.airlinesVersion) {
		const entries = (await fetchApi<StaticAirline[]>(`${R2_BUCKET_URL}/airlines_${latestManifest.airlinesVersion}.json`, {
			cache: "no-store",
		})) as StaticAirline[];
		storeData(entries, db.airlines as EntityTable<any, "id">);
	}
	setStatus?.((prev) => ({ ...prev, airlines: true }));

	if (latestManifest.aircraftsVersion !== storedManifest?.versions.aircraftsVersion) {
		const entries = (await fetchApi<StaticAircraftType[]>(`${R2_BUCKET_URL}/aircrafts_${latestManifest.aircraftsVersion}.json`, {
			cache: "no-store",
		})) as StaticAircraftType[];
		storeData(entries, db.aircrafts as EntityTable<StaticAircraftType, "icao">);
	}
	setStatus?.((prev) => ({ ...prev, aircrafts: true }));

	const ngData = await ensureNavigraphData(storedManifest?.versions.navigraphCycle);
	if (ngData) {
		const { dataset } = ngData;
		await db.ngWaypoints.clear();
		await db.ngWaypoints.bulkPut(dataset.waypoints);
		await db.ngAirways.clear();
		await db.ngAirways.bulkPut(dataset.airways);
		await db.ngAirports.clear();
		await db.ngAirports.bulkPut(dataset.airports);
	}
	setStatus?.((prev) => ({ ...prev, navigraph: true }));

	await db.manifest.put({
		key: "databaseVersions",
		versions: { ...latestManifest, navigraphCycle: ngData?.cycle ?? storedManifest?.versions.navigraphCycle },
	});
	localStorage.setItem("simradar21-db", Date.now().toString());
}

async function storeData<T, K extends keyof T>(data: T[], db: EntityTable<T, K>): Promise<void> {
	await db.clear();
	await db
		.bulkPut(data)
		.then(() => {
			console.log("Done adding data");
		})
		.catch((e) => {
			if (e.name === "BulkError") {
				console.error(`Some items did not succeed. Completed: ${e.failures.length}`);
			} else {
				throw e;
			}
		});
}

export async function dxClearDatabase(): Promise<void> {
	await db.delete();
	localStorage.removeItem("simradar21-db");
}

export async function dxGetAllAirports(): Promise<StaticAirport[]> {
	await dxEnsureInitialized();
	return await db.airports.toArray();
}

export async function dxGetAirport(id: string): Promise<StaticAirport | null> {
	await dxEnsureInitialized();
	return (await db.airports.get(id)) || null;
}

export async function dxGetAirline(id: string): Promise<StaticAirline | null> {
	await dxEnsureInitialized();
	return (await db.airlines.get(id)) || null;
}

export async function dxFindAirlines(query: string, limit: number): Promise<StaticAirline[]> {
	await dxEnsureInitialized();
	return await db.airlines
		.filter((airline) => startsAtWord(airline.name, query) || airline.id.toLowerCase().startsWith(query.toLowerCase()))
		.limit(limit)
		.toArray();
}

export async function dxFindAircrafts(query: string, limit: number): Promise<StaticAircraftType[]> {
	await dxEnsureInitialized();
	return await db.aircrafts
		.filter((aircraft) => startsAtWord(aircraft.name, query) || aircraft.icao.toLowerCase().startsWith(query.toLowerCase()))
		.limit(limit)
		.toArray();
}

export async function dxFindAirports(query: string, limit: number): Promise<StaticAirport[]> {
	await dxEnsureInitialized();
	return await db.airports
		.filter((airport) => startsAtWord(airport.name, query) || airport.id.toLowerCase().startsWith(query.toLowerCase()))
		.limit(limit)
		.toArray();
}

function startsAtWord(param: string, query: string): boolean {
	const q = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const regex = new RegExp(`\\b${q}`, "i");
	return regex.test(param);
}

export async function dxGetTracons(ids: string[]): Promise<(DexieFeature | undefined)[]> {
	await dxEnsureInitialized();
	return await db.tracons.bulkGet(ids);
}

export async function dxGetFirs(ids: string[]): Promise<(DexieFeature | undefined)[]> {
	await dxEnsureInitialized();
	return await db.firs.bulkGet(ids);
}

export async function dxGetNavigraphAirports(ids: string[]): Promise<(NavigraphAirport | undefined)[]> {
	await dxEnsureInitialized();
	return await db.ngAirports.bulkGet(ids);
}

export async function dxGetNavigraphAirport(id: string): Promise<NavigraphAirport | undefined> {
	await dxEnsureInitialized();
	return await db.ngAirports.get(id);
}

export async function dxGetNavigraphWaypoints(uids: string[]): Promise<(NavigraphWaypoint | undefined)[]> {
	await dxEnsureInitialized();
	return await db.ngWaypoints.bulkGet(uids);
}

export async function dxGetNavigraphWaypoint(uid: string): Promise<NavigraphWaypoint | undefined> {
	await dxEnsureInitialized();
	return await db.ngWaypoints.get(uid);
}

export async function dxGetNavigraphProceduresByAirport(type: "sids" | "stars", airportId: string): Promise<NavigraphProcedure[]> {
	await dxEnsureInitialized();
	return await db.ngAirports.get(airportId).then((airport) => {
		if (!airport) return [];
		return airport[type];
	});
}

export async function dxGetNavigraphApproachesByAirport(airportId: string): Promise<NavigraphApproach[]> {
	await dxEnsureInitialized();
	return await db.ngAirports.get(airportId).then((airport) => {
		if (!airport) return [];
		return airport.approaches;
	});
}
