import { rdsGetSingle } from "@sr24/db/redis";
import type { NavigraphPackage } from "@sr24/types/db";
import type { PilotParsedRoute, PilotRoutePoint } from "@sr24/types/interface";
import type { NavigraphAirport, NavigraphAirway, NavigraphDataset, NavigraphNavaid, NavigraphSid, NavigraphWaypoint } from "@sr24/types/navigraph";
import type { VatsimPilotFlightPlan } from "@sr24/types/vatsim";

let gatesByAirport: Map<string, NavigraphAirport> = new Map();
let waypointsByName: Map<string, NavigraphWaypoint[]> = new Map();
let navaidsByName: Map<string, NavigraphNavaid[]> = new Map();
let airwaysByName: Map<string, NavigraphAirway[]> = new Map();
let sidsByAirport: Map<string, NavigraphSid[]> = new Map();
let starsByAirport: Map<string, NavigraphSid[]> = new Map();
let loadedCycle: string | null = null;

export async function ensureNavigraphData(): Promise<void> {
	const pkg = (await rdsGetSingle("navigraph:package:current")) as NavigraphPackage | null;
	if (!pkg || pkg.cycle === loadedCycle) return;

	const dataset = (await rdsGetSingle("navigraph:data:current")) as NavigraphDataset | null;
	if (!dataset) return;

	gatesByAirport = new Map(dataset.airports.map((a) => [a.id, a]));

	waypointsByName = new Map();
	for (const wp of dataset.waypoints) {
		const arr = waypointsByName.get(wp.id) ?? [];
		arr.push(wp);
		waypointsByName.set(wp.id, arr);
	}

	navaidsByName = new Map();
	for (const nav of dataset.navaids) {
		const arr = navaidsByName.get(nav.id) ?? [];
		arr.push(nav);
		navaidsByName.set(nav.id, arr);
	}

	airwaysByName = new Map();
	for (const airway of dataset.airways) {
		const arr = airwaysByName.get(airway.id) ?? [];
		arr.push(airway);
		airwaysByName.set(airway.id, arr);
	}

	sidsByAirport = new Map();
	for (const sid of dataset.sids) {
		const arr = sidsByAirport.get(sid.airportId) ?? [];
		arr.push(sid);
		sidsByAirport.set(sid.airportId, arr);
	}

	starsByAirport = new Map();
	for (const star of dataset.stars) {
		const arr = starsByAirport.get(star.airportId) ?? [];
		arr.push(star);
		starsByAirport.set(star.airportId, arr);
	}

	loadedCycle = pkg.cycle;
}

export function getAirportGates(icao: string): NavigraphAirport | undefined {
	return gatesByAirport.get(icao);
}

// Parse 52N050W or 5230N01000W into lat/lon coordinates
function parseLatLon(token: string): { latitude: number; longitude: number } | null {
	const short = token.match(/^(\d{2})([NS])(\d{3})([EW])$/);
	if (short) {
		return {
			latitude: Number(short[1]) * (short[2] === "N" ? 1 : -1),
			longitude: Number(short[3]) * (short[4] === "E" ? 1 : -1),
		};
	}

	const long = token.match(/^(\d{2})(\d{2})([NS])(\d{3})(\d{2})([EW])$/);
	if (long) {
		return {
			latitude: (Number(long[1]) + Number(long[2]) / 60) * (long[3] === "N" ? 1 : -1),
			longitude: (Number(long[4]) + Number(long[5]) / 60) * (long[6] === "E" ? 1 : -1),
		};
	}

	return null;
}

// Strip speed/altitude constraint suffix: WAYPOINT/M084F370 → WAYPOINT
function stripConstraint(token: string): string {
	return token.split("/")[0];
}

function lookupFix(id: string): PilotRoutePoint | null {
	const wps = waypointsByName.get(id);
	if (wps?.length) {
		const { id: wId, name, latitude, longitude } = wps[0];
		return { id: wId, name, latitude, longitude, type: "WP" };
	}

	const navs = navaidsByName.get(id);
	if (navs?.length) {
		const { id: nId, name, latitude, longitude, type } = navs[0];
		return { id: nId, name, latitude, longitude, type };
	}

	return null;
}

// Return intermediate waypoints between entry and exit along an airway (exclusive of both endpoints)
function expandAirway(airwayId: string, entryId: string, exitId: string): PilotRoutePoint[] {
	const airways = airwaysByName.get(airwayId);
	if (!airways) return [];

	for (const airway of airways) {
		const entryIdx = airway.waypoints.indexOf(entryId);
		const exitIdx = airway.waypoints.indexOf(exitId);
		if (entryIdx === -1 || exitIdx === -1) continue;

		const step = entryIdx < exitIdx ? 1 : -1;
		const result: PilotRoutePoint[] = [];

		for (let j = entryIdx + step; j !== exitIdx; j += step) {
			const fix = lookupFix(airway.waypoints[j]);
			if (fix) result.push({ ...fix, airway: airwayId });
		}

		return result;
	}

	return [];
}

export function parseRouteString(flightplan: VatsimPilotFlightPlan): PilotParsedRoute {
	if (!flightplan?.route) return { sid: null, star: null, waypoints: [] };

	const tokens = flightplan.route.trim().split(/\s+/).filter(Boolean);
	if (tokens.length === 0) return { sid: null, star: null, waypoints: [] };

	let startIdx = 0;
	let endIdx = tokens.length - 1;

	let sid: string | null = null;
	const depSids = sidsByAirport.get(flightplan.departure);
	if (depSids) {
		const first = stripConstraint(tokens[0]);
		const match = depSids.find((s) => s.id === first);
		if (match) {
			sid = match.id;
			startIdx = 1;
		}
	}

	let star: string | null = null;
	const arrStars = starsByAirport.get(flightplan.arrival);
	if (arrStars && endIdx >= startIdx) {
		const last = stripConstraint(tokens[endIdx]);
		const match = arrStars.find((s) => s.id === last);
		if (match) {
			star = match.id;
			endIdx--;
		}
	}

	const waypoints: PilotRoutePoint[] = [];
	let lastId: string | null = null;
	let i = startIdx;

	while (i <= endIdx) {
		const raw = tokens[i];

		if (raw === "DCT") {
			i++;
			continue;
		}

		const fixId = stripConstraint(raw);

		const latLon = parseLatLon(fixId);
		if (latLon) {
			waypoints.push({ id: fixId, name: fixId, ...latLon, type: "WP" });
			lastId = fixId;
			i++;
			continue;
		}

		const fix = lookupFix(fixId);

		if (!fix && airwaysByName.has(fixId)) {
			if (lastId && i + 1 <= endIdx) {
				const exitId = stripConstraint(tokens[i + 1]);
				waypoints.push(...expandAirway(fixId, lastId, exitId));
			}
			i++;
			continue;
		}

		if (fix) {
			waypoints.push(fix);
			lastId = fix.id;
		}

		i++;
	}

	return { sid, star, waypoints };
}
