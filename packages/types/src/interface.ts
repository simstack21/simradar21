import type { VatsimEvent } from "./vatsim";

export interface TrackPoint {
	coordinates: [number, number];
	altitude_ms: number;
	altitude_agl?: number;
	groundspeed: number;
	vertical_speed?: number;
	heading?: number;
	color: string;
	timestamp: number;
}

export interface DecodedTrackPoint {
	x: number;
	y: number;
	alt_msl: number;
	alt_agl: number;
	gs: number;
	vs: number;
	hdg: number;
	color: number;
	ts: number;
}

export interface DeltaTrackPoint {
	m: number;
	v: number[];
	t: number;
}

export interface PilotShort {
	id: string;
	callsign?: string;
	coordinates?: [number, number];
	altitude_agl?: number;
	altitude_ms?: number;
	groundspeed?: number;
	vertical_speed?: number;
	heading?: number;
	aircraft?: string;
	transponder?: string;
	frequency?: number;
	route?: string;
	flight_rules?: "IFR" | "VFR";
	ac_reg?: string | null;
}

export interface PilotLong {
	id: string;
	cid: string;
	callsign: string;
	longitude: number;
	latitude: number;
	altitude_agl: number;
	altitude_ms: number;
	groundspeed: number;
	vertical_speed: number;
	heading: number;
	aircraft: string;
	transponder: string;
	frequency: number;
	name: string;
	server: string;
	qnh_i_hg: number;
	qnh_mb: number;
	flight_plan: PilotFlightPlan | null;
	times: PilotTimes | null;
	user_ratings: UserRatings | null;
	logon_time: Date;
	last_update: Date;
	live: "pre" | "live" | "off";
	overrides: PilotOverrides | null;
}

export interface PilotFlightPlan {
	flight_rules: "IFR" | "VFR";
	ac_reg: string | null;
	departure: PilotAirport;
	arrival: PilotAirport;
	alternate: PilotAirport;
	filed_tas: number;
	filed_altitude: number;
	enroute_time: number;
	fuel_time: number;
	remarks: string;
	route: string;
	parsed_route: PilotParsedRoute;
	revision_id: number;
}

export type PilotParsedRoute = {
	sid: PilotRouteProcedure | null;
	star: PilotRouteProcedure | null;
	waypoints: PilotRoutePoint[];
};

export type PilotRoutePoint = {
	uid: string;
	airwayUid?: string;
};

export type PilotRouteProcedure = {
	override: boolean;
	airport: string;
	rwy: string | null;
	rwyCon: string | null;
	proc: string | null;
	trans: string | null;
	approach: string | null;
	approachTrans: string | null;
	missedApproach: string | null;
};

export interface PilotTimes {
	sched_off_block: number;
	off_block: number;
	lift_off: number;
	touch_down: number;
	sched_on_block: number;
	on_block: number;
	state: "Boarding" | "Taxi Out" | "Climb" | "Cruise" | "Descent" | "Taxi In" | "On Block";
	stop_counter: number;
}

interface PilotAirport {
	icao: string;
	latitude?: number;
	longitude?: number;
}

export interface UserRatings {
	pilot_rating: number;
	military_rating: number;
	controller_rating: number;
	pilot_hours: number;
	controller_hours: number;
}

export type PilotOverrides = {
	modifiedRoute?: PilotParsedRoute;
	diversionAirport?: string;
};

export interface ControllerShort {
	callsign: string;
	frequency?: number;
	facility: number;
	atis?: string[] | null;
	connections?: number;
	logon_time?: number;
	posId?: string;
	booking?: {
		start: string;
		end: string;
		type: "event" | "exam" | "training" | "booking";
	};
}

export interface ControllerLong {
	cid: string;
	callsign: string;
	name: string;
	frequency: number;
	facility: number;
	atis: string[] | null;
	connections: number;
	user_ratings: UserRatings | null;
	server: string;
	visual_range: number;
	logon_time: number;
	timestamp: number;
}

export interface ControllerMerged {
	id: string;
	facility: "airport" | "tracon" | "fir";
	controllers: ControllerShort[];
	datasetId?: string;
}

export interface AirportShort {
	icao: string;
	dep_traffic?: AirportTraffic;
	arr_traffic?: AirportTraffic;
	blocked_gates?: string[];
}

export interface AirportLong extends Required<AirportShort> {
	busiest: { departure: [string, string]; arrival: [string, string] };
	unique: { departures: number; arrivals: number };
	expected: { departure: number[]; arrival: number[] };
}

export interface AirportTraffic {
	traffic_count: number;
	average_delay: number;
	flights_delayed: number;
}

export interface PilotDelta {
	updated: PilotShort[];
	added: Required<PilotShort>[];
}

export interface ControllerDelta {
	updated: ControllerMerged[];
	added: ControllerMerged[];
}

export interface AirportDelta {
	updated: AirportShort[];
	added: Required<AirportShort>[];
}

export interface WsDelta {
	pilots: PilotDelta;
	controllers: ControllerDelta;
	airports: AirportDelta;
	timestamp: Date;
}

export interface InitialData {
	pilots: Required<PilotShort>[];
	controllers: Required<ControllerMerged>[];
	airports: Required<AirportShort>[];
	timestamp: Date;
}

export interface DashboardData {
	history: DashboardHistory[];
	stats: DashboardStats;
	events: VatsimEvent[];
}

export type DashboardHistory = [number, number, number];

export interface DashboardStats {
	pilots: number;
	controllers: number;
	supervisors: number;
	busiestAirports: { icao: string; departures: number; arrivals: number }[];
	quietestAirports: { icao: string; departures: number; arrivals: number }[];
	busiestRoutes: { departure: string; arrival: string; count: number }[];
	quietestRoutes: { departure: string; arrival: string; count: number }[];
	busiestAircrafts: { aircraft: string; count: number }[];
	rarestAircrafts: { aircraft: string; count: number }[];
	busiestControllers: { callsign: string; count: number }[];
	quietestControllers: { callsign: string; count: number }[];
}

export interface RedisAll {
	pilots: PilotLong[];
	controllers: ControllerLong[];
	airports: AirportLong[];
	dashboard: DashboardData;
	init: InitialData;
}

export interface Booking {
	id: string;
	callsign: string;
	facility: number;
	type: "event" | "exam" | "training" | "booking";
	start: string;
	end: string;
}
