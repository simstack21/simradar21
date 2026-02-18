import { dxFindAircrafts, dxFindAirlines, dxFindAirports } from "@/storage/dexie";
import type { FilterDefinition } from "@/types/zustand";

const FILTERS: FilterDefinition[] = [
	{
		key: "airline",
		label: "Airline",
		description: "DLH, Lufthansa, etc.",
		category: "Airline",
		input: "select",
		options: async (input: string) => {
			const results = await dxFindAirlines(input, 10);
			return results.map((airline) => ({ value: airline.id, label: airline.name }));
		},
		extendedOptions: true,
		uppercase: true,
	},
	{
		key: "callsign",
		label: "Callsign",
		description: "DLH1234, AAL5678, etc.",
		category: "Airline",
		input: "select",
		options: [],
		uppercase: true,
	},
	{
		key: "type",
		label: "Aircraft Type",
		description: "A20N, Airbus A320 Neo, etc.",
		category: "Aircraft",
		input: "select",
		options: async (input: string) => {
			const results = await dxFindAircrafts(input, 10);
			return results.map((aircraft) => ({ value: aircraft.icao, label: aircraft.name }));
		},
		extendedOptions: true,
	},
	{
		key: "registration",
		label: "Aircraft Registration",
		description: "D-ABCD, N12345, etc.",
		category: "Aircraft",
		input: "select",
		options: [],
		uppercase: true,
	},
	{
		key: "departure",
		label: "Departure Airport",
		description: "EDDF, Frankfurt, etc.",
		category: "Airport",
		input: "select",
		options: async (input: string) => {
			const results = await dxFindAirports(input, 10);
			return results.map((airport) => ({ value: airport.id, label: airport.name }));
		},
		uppercase: true,
		extendedOptions: true,
	},
	{
		key: "arrival",
		label: "Arrival Airport",
		description: "KJFK, New York, etc.",
		category: "Airport",
		input: "select",
		options: async (input: string) => {
			const results = await dxFindAirports(input, 10);
			return results.map((airport) => ({ value: airport.id, label: airport.name }));
		},
		uppercase: true,
		extendedOptions: true,
	},
	{
		key: "anyAirport",
		label: "Any Airport",
		description: "EGLL, London, etc.",
		category: "Airport",
		input: "select",
		options: async (input: string) => {
			const results = await dxFindAirports(input, 10);
			return results.map((airport) => ({ value: airport.id, label: airport.name }));
		},
		uppercase: true,
		extendedOptions: true,
	},
	{
		key: "altitude",
		label: "Barometric Altitude",
		description: "Altitude range in feet",
		category: "Telemetry",
		input: "range",
		min: 0,
		max: 50000,
	},
	{
		key: "groundspeed",
		label: "Groundspeed",
		description: "Speed range in knots",
		category: "Telemetry",
		input: "range",
		min: 0,
		max: 1000,
	},
	{
		key: "squawk",
		label: "Transponder Squawk",
		description: "1000, 2000, etc.",
		category: "Telemetry",
		input: "select",
		options: [],
	},
	{
		key: "rules",
		label: "Flight Rules",
		description: "IFR or VFR",
		category: "Telemetry",
		input: "select",
		options: [
			{ value: "IFR", label: "IFR" },
			{ value: "VFR", label: "VFR" },
		],
	},
];

export const FILTER_BY_KEY = Object.fromEntries(FILTERS.map((f) => [f.key, f]));

const CATEGORIES = Array.from(new Set(FILTERS.map((f) => f.category))).map((category) => ({
	value: category,
	label: category,
}));
export const FILTER_CATEGORIES = [{ value: null, label: "Select a category" }, ...CATEGORIES];

export const FILTER_SUB_CATEGORIES = FILTERS.reduce<Record<string, typeof FILTERS>>((acc, filter) => {
	acc[filter.category] ??= [];
	acc[filter.category].push(filter);
	return acc;
}, {});
