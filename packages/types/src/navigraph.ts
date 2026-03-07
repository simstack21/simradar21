export type NavigraphDataset = {
	waypoints: NavigraphWaypoint[];
	airways: NavigraphAirway[];
	airports: NavigraphAirport[];
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
	runways: NavigraphRunway[];
	sids: NavigraphProcedure[];
	stars: NavigraphProcedure[];
	approaches: NavigraphApproach[];
};

export type NavigraphGate = {
	id: string;
	latitude: number;
	longitude: number;
};

export type NavigraphRunway = {
	id: string;
	longitude: number;
	latitude: number;
};

// SIDs and STARs
export type NavigraphProcedure = {
	uid: string; // airportId:id:transitionId or airportId:id:runwayId or airportId:id:All
	id: string;
	waypoints: string[];
};

// https://developers.navigraph.com/docs/navigation-data/dfd-data-format-v2#route-type-of-iaps-pf
export type NavigraphApproach = {
	uid: string; // airportId:id:transitionId or airportId:id:FINAL or airportId:id:MISSED
	id: string;
	waypoints: NavigraphApproachWaypoint[];
};

export type NavigraphApproachWaypoint = {
	uid?: string;
	id?: string;
	longitude?: number;
	latitude?: number;
};
