import type { Feature, FeatureCollection, MultiPolygon } from "geojson";

export interface OurAirportsCsv {
	id: string;
	ident: string;
	type: string;
	name: string;
	latitude_deg: string;
	longitude_deg: string;
	elevation_ft: string;
	continent: string;
	iso_country: string;
	iso_region: string;
	municipality: string;
	scheduled_service: string;
	icao_code: string;
	iata_code: string;
	gps_code: string;
	local_code: string;
	home_link: string;
	wikipedia_link: string;
	keywords: string;
}

export interface StaticAirport {
	id: string;
	iata: string;
	size: string;
	name: string;
	city: string;
	country: string;
	latitude: number;
	longitude: number;
	timezone: string;
}

interface SimAwareTRACONProperties {
	id: string;
	prefix: string[] | string;
	name: string;
	label_lat?: number;
	label_lon?: number;
}

export type SimAwareTraconFeature = Feature<MultiPolygon, SimAwareTRACONProperties>;

export interface VatSpyDat {
	icao: string;
	name: string;
	callsign_prefix: string;
	fir_bound: string;
}

interface VatSpyFIRProperties {
	id: string;
	oceanic: "0" | "1";
	label_lon: string;
	label_lat: string;
	region: string;
	division: string;
}

export type VatSpyFIRFeatureCollection = FeatureCollection<MultiPolygon, VatSpyFIRProperties>;

export interface FIRProperties extends VatSpyFIRProperties {
	name: string;
	callsign_prefix: string;
}

export type FIRFeature = Feature<MultiPolygon, FIRProperties>;

export interface StaticAirline {
	id: string;
	iata: string;
	name: string;
	callsign: string;
	country: string;
	color?: string[];
}

type PlanespottersThumbnail = {
	src: string;
	size: {
		width: number;
		height: number;
	};
};

type PlanespottersPhoto = {
	id: string;
	thumbnail?: PlanespottersThumbnail;
	thumbnail_large?: PlanespottersThumbnail;
	link: string;
	photographer: string;
};

export type PlaneSpottersPhotos = {
	photos: PlanespottersPhoto[];
};

export type StaticAircraftImg = {
	id: string;
	imgUrl: string;
	width: number;
	height: number;
	photographer: string;
	link: string;
};

export interface StaticAircraft {
	icao24: string;
	built: string;
	manufacturerName: string;
	model: string;
	owner: string;
	registration: string;
	selCal: string;
	serialNumber: string;
	typecode: string;
	country: string;
	imgs?: StaticAircraftImg[];
}

export interface StaticAircraftType {
	name: string;
	iata: string;
	icao: string;
}

export interface NavigraphPackage {
	id: string;
	name: string;
	format: string;
	cycle: string;
	r2Key: string;
	package_status: "current" | "outdated" | "future";
}

export interface VatglassesSector {
	points: [string, string][];
	min?: number;
	max?: number;
	runways?: { icao: string; runway: string | string[] }[];
}

export interface VatglassesAirspaceEntry {
	id: string;
	group: string;
	owner?: string[];
	sectors: VatglassesSector[];
}

export interface VatglassesPosition {
	pre?: string | string[];
	type: string;
	frequency?: string;
	callsign?: string;
	colours?: { hex: string; online?: string | string[] }[];
}

export interface VatglassesGroup {
	name: string;
	colour?: string;
	color?: string;
}

export interface VatglassesDataset {
	code: string;
	airspace: VatglassesAirspaceEntry[];
	positions: Record<string, VatglassesPosition>;
	groups: Record<string, VatglassesGroup>;
}
