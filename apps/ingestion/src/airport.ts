import type { AirportDelta, AirportLong, AirportShort, PilotLong } from "@sr24/types/interface";
import { getAirportGates } from "./navigraph.js";
import { distanceMeters } from "./utils/helpers.js";

const GATE_BLOCK_RADIUS_M = 50;
const GATE_BLOCK_MAX_GS = 5;

let cached: AirportLong[] = [];
let updated: AirportShort[] = [];
let added: Required<AirportShort>[] = [];

export async function mapAirports(pilotsLong: PilotLong[]): Promise<AirportLong[]> {
	const airportRecord: Record<string, AirportLong> = {};
	const routeRecord: Record<string, Map<string, number>> = {};

	for (const pilotLong of pilotsLong) {
		if (!pilotLong.flight_plan?.departure.icao) continue;

		const departure = pilotLong.flight_plan.departure;
		const arrival = pilotLong.flight_plan.arrival;

		if (!airportRecord[departure.icao]) {
			airportRecord[departure.icao] = initAirportRecord(departure.icao);
		}
		if (!airportRecord[arrival.icao]) {
			airportRecord[arrival.icao] = initAirportRecord(arrival.icao);
		}

		const depTraffic = airportRecord[departure.icao].dep_traffic;
		depTraffic.traffic_count++;

		const depDelay = calculateDepartureDelay(pilotLong);
		if (depDelay !== 0) {
			depTraffic.flights_delayed++;
			depTraffic.average_delay = Math.round((depTraffic.average_delay * (depTraffic.flights_delayed - 1) + depDelay) / depTraffic.flights_delayed);
		}

		const depExpectedIndex = getExpectedIndex(pilotLong, "departure");
		if (depExpectedIndex !== -1) {
			airportRecord[departure.icao].expected.departure[depExpectedIndex] =
				(airportRecord[departure.icao].expected.departure[depExpectedIndex] || 0) + 1;
		}

		const arrTraffic = airportRecord[arrival.icao].arr_traffic;
		arrTraffic.traffic_count++;

		const arrDelay = calculateArrivalDelay(pilotLong);
		if (arrDelay !== 0) {
			arrTraffic.flights_delayed++;
			arrTraffic.average_delay = Math.round((arrTraffic.average_delay * (arrTraffic.flights_delayed - 1) + arrDelay) / arrTraffic.flights_delayed);
		}

		const arrExpectedIndex = getExpectedIndex(pilotLong, "arrival");
		if (arrExpectedIndex !== -1) {
			airportRecord[arrival.icao].expected.arrival[arrExpectedIndex] = (airportRecord[arrival.icao].expected.arrival[arrExpectedIndex] || 0) + 1;
		}

		const setRoute = (icao: string, route: string) => {
			if (!routeRecord[icao]) routeRecord[icao] = new Map();

			const current = routeRecord[icao].get(route) || 0;
			routeRecord[icao].set(route, current + 1);
		};

		const route = `${departure.icao}-${arrival.icao}`;
		setRoute(departure.icao, route);
		setRoute(arrival.icao, route);
	}

	// Get busiest and total routes
	for (const icao of Object.keys(routeRecord)) {
		const routes = routeRecord[icao];
		if (!routes) continue;

		let busiestDeparture: [string, string] = ["", ""];
		let busiestArrival: [string, string] = ["", ""];
		let busiestDepCount = 0;
		let busiestArrCount = 0;
		let uniqueDepartures = 0;
		let uniqueArrivals = 0;

		routes.forEach((count, route) => {
			const [depIcao, arrIcao] = route.split("-");
			if (depIcao === icao) {
				uniqueDepartures++;
				if (count > busiestDepCount) {
					busiestDeparture = [depIcao, arrIcao];
					busiestDepCount = count;
				}
			} else if (arrIcao === icao) {
				uniqueArrivals++;
				if (count > busiestArrCount) {
					busiestArrival = [depIcao, arrIcao];
					busiestArrCount = count;
				}
			}
		});

		airportRecord[icao].busiest = {
			departure: busiestDeparture,
			arrival: busiestArrival,
		};
		airportRecord[icao].unique = {
			departures: uniqueDepartures,
			arrivals: uniqueArrivals,
		};
	}

	const pilotsByAirport = new Map<string, PilotLong[]>();
	for (const pilot of pilotsLong) {
		if (pilot.live !== "live" || pilot.groundspeed > GATE_BLOCK_MAX_GS) continue;

		for (const icao of [pilot.flight_plan?.departure.icao, pilot.flight_plan?.arrival.icao]) {
			if (!icao) continue;

			let bucket = pilotsByAirport.get(icao);
			if (!bucket) {
				bucket = [];
				pilotsByAirport.set(icao, bucket);
			}
			bucket.push(pilot);
		}
	}

	for (const [icao, airport] of Object.entries(airportRecord)) {
		const ngAirport = getAirportGates(icao);
		if (!ngAirport) continue;

		const pilots = pilotsByAirport.get(icao) ?? [];
		const blocked = new Set<string>();

		for (const pilot of pilots) {
			let nearestId: string | null = null;
			let nearestDist = GATE_BLOCK_RADIUS_M;

			for (const gate of ngAirport.gates) {
				const dist = distanceMeters(pilot.latitude, pilot.longitude, gate.latitude, gate.longitude);
				if (dist < nearestDist) {
					nearestDist = dist;
					nearestId = gate.id;
				}
			}
			if (nearestId) blocked.add(nearestId);
		}
		airport.blocked_gates = [...blocked];
	}

	const airportsLong = Object.values(airportRecord);
	setAirportDelta(airportsLong);

	return airportsLong;
}

function setAirportDelta(airportsLong: AirportLong[]): void {
	updated = [];
	added = [];

	for (const a of airportsLong) {
		const cachedAirport = cached.find((c) => c.icao === a.icao);

		if (!cachedAirport) {
			added.push(getAirportShort(a) as Required<AirportShort>);
		} else {
			const airportShort = getAirportShort(a, cachedAirport);
			updated.push(airportShort);
		}
	}

	cached = airportsLong;
}

export function getAirportShort(a: AirportLong): Required<AirportShort>;
export function getAirportShort(a: AirportLong, c: AirportLong): AirportShort;
export function getAirportShort(a: AirportLong, c?: AirportLong): AirportShort {
	if (!c) {
		return {
			icao: a.icao,
			dep_traffic: a.dep_traffic,
			arr_traffic: a.arr_traffic,
			blocked_gates: a.blocked_gates,
		};
	} else {
		const airportShort: AirportShort = { icao: a.icao };

		if (JSON.stringify(a.dep_traffic) !== JSON.stringify(c.dep_traffic)) airportShort.dep_traffic = a.dep_traffic;
		if (JSON.stringify(a.arr_traffic) !== JSON.stringify(c.arr_traffic)) airportShort.arr_traffic = a.arr_traffic;
		if (JSON.stringify(a.blocked_gates) !== JSON.stringify(c.blocked_gates)) airportShort.blocked_gates = a.blocked_gates;

		return airportShort;
	}
}

export function getAirportDelta(): AirportDelta {
	return {
		added,
		updated,
	};
}

function initAirportRecord(icao: string): AirportLong {
	return {
		icao: icao,
		dep_traffic: { traffic_count: 0, average_delay: 0, flights_delayed: 0 },
		arr_traffic: { traffic_count: 0, average_delay: 0, flights_delayed: 0 },
		busiest: { departure: ["", ""], arrival: ["", ""] },
		unique: { departures: 0, arrivals: 0 },
		expected: { departure: [], arrival: [] },
		blocked_gates: [],
	};
}

function calculateDepartureDelay(pilot: PilotLong): number {
	if (!pilot.times?.off_block) return 0;
	const times = pilot.times;
	const delay_min = (times.off_block - times.sched_off_block) / 1000 / 60;

	return Math.min(Math.max(delay_min, 0), 120);
}

function calculateArrivalDelay(pilot: PilotLong): number {
	if (!pilot.times?.on_block) return 0;
	const times = pilot.times;
	const delay_min = (times.on_block - times.sched_on_block) / 1000 / 60;

	return Math.min(Math.max(delay_min, 0), 120);
}

const INDEX_INTERVAL_MIN = 30;
const INDEX_LIMITS_MIN = [-30, 360];

function getExpectedIndex(pilot: PilotLong, type: "departure" | "arrival"): number {
	if (!pilot.times) return -1;

	const time = pilot.times[type === "departure" ? "off_block" : "on_block"];
	const minFromNow = (time - Date.now()) / 1000 / 60;
	if (minFromNow < INDEX_LIMITS_MIN[0] || minFromNow > INDEX_LIMITS_MIN[1]) return -1;

	return Math.floor((minFromNow - INDEX_LIMITS_MIN[0]) / INDEX_INTERVAL_MIN);
}
