export type NavigraphDataset = {
	waypoints: NavigraphWaypoint[];
	airways: NavigraphAirway[];
	airports: NavigraphAirport[];
	sids: NavigraphProcedure[];
	stars: NavigraphProcedure[];
};

// VHFs and NDBs
// type: VOR, DME, VORDME, TACAN, NDB, INT, WPT
export type NavigraphWaypoint = {
	uid: string; // type:areaCode:countryCode:id
	id: string;
	name: string;
	latitude: number;
	longitude: number;
	class: "VOR" | "DME" | "VORDME" | "TACAN" | "NDB" | "INT" | "WPT";
	frequency?: number;
};

export type NavigraphAirway = {
	uid: string; // entryId:id:exitId
	id: string;
	type: string;
	waypoints: string[];
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
export type NavigraphProcedure = {
	uid: string; // airportId:id:transitionId
	id: string;
	waypoints: string[];
};
