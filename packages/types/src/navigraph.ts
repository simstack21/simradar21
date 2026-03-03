export type NavigraphDataset = {
	navaids: NavigraphNavaid[];
	waypoints: NavigraphWaypoint[];
	airways: NavigraphAirway[];
	airports: NavigraphAirport[];
	sids: NavigraphSid[];
	stars: NavigraphSid[];
};

// VHFs and NDBs
export type NavigraphNavaid = {
	id: string;
	areaCode: string;
	name: string;
	type: "VOR" | "NDB";
	latitude: number;
	longitude: number;
	frequency: number;
};

// Enroute and terminal waypoints
export type NavigraphWaypoint = {
	id: string;
	areaCode: string;
	name: string;
	latitude: number;
	longitude: number;
};

export type NavigraphAirway = {
	id: string;
	areaCode: string;
	type: string;
	waypoints: string[]; // waypoint ids sorted by seqno
};

export type NavigraphAirport = {
	id: string;
	latitude: number;
	longitude: number;
	gates: NavigraphGate[];
};

export type NavigraphGate = {
	id: string;
	latitude: number;
	longitude: number;
};

// SIDs and STARs
export type NavigraphSid = {
	id: string;
	airportId: string;
	waypoints: string[]; // waypoint ids sorted by seqno
};

export type NavigraphStar = NavigraphSid;
