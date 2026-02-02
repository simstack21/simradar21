import { StaticAirline, StaticAirport } from "@sr24/types/db";

export interface PilotPanelStatic {
	airline: StaticAirline | null;
	departure: StaticAirport | null;
	arrival: StaticAirport | null;
}
