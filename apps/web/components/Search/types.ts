import type { StaticAirline, StaticAirport } from "@sr24/types/db";
import type { PilotLong } from "@sr24/types/interface";
import type { LucideIcon } from "lucide-react";

export type QueryResult = {
	airlines?: StaticAirline[];
	airports?: StaticAirport[];
	pilots?: PilotResult;
};

export type PilotResult = {
	live: PilotLong[];
	offline: PilotLong[];
};

export type PilotMatch = {
	callsign?: string;
	departure?: string;
	arrival?: string;
	cid?: string;
	name?: string;
};

export type FilterItem = {
	value: string;
	icon: LucideIcon;
	placeholder?: string;
};

export type HistoryItem = {
	value: string;
	type: FilterItem["value"];
};
