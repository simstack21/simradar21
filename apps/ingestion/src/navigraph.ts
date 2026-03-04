import { rdsGetSingle } from "@sr24/db/redis";
import type { NavigraphPackage } from "@sr24/types/db";
import type { PilotParsedRoute, PilotRoutePoint } from "@sr24/types/interface";
import type { NavigraphAirport, NavigraphAirway, NavigraphDataset, NavigraphProcedure, NavigraphWaypoint } from "@sr24/types/navigraph";
import type { VatsimPilotFlightPlan } from "@sr24/types/vatsim";

let gatesByAirport: Map<string, NavigraphAirport> = new Map();
let waypointsByName: Map<string, NavigraphWaypoint[]> = new Map();
let airwaysByName: Map<string, NavigraphAirway[]> = new Map();
let sidsByAirport: Map<string, NavigraphProcedure[]> = new Map();
let starsByAirport: Map<string, NavigraphProcedure[]> = new Map();
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

	airwaysByName = new Map();
	for (const airway of dataset.airways) {
		const arr = airwaysByName.get(airway.id) ?? [];
		arr.push(airway);
		airwaysByName.set(airway.id, arr);
	}

	sidsByAirport = new Map();
	for (const sid of dataset.sids) {
		const airportId = sid.uid.split(":")[0];
		const arr = sidsByAirport.get(airportId) ?? [];
		arr.push(sid);
		sidsByAirport.set(airportId, arr);
	}

	starsByAirport = new Map();
	for (const star of dataset.stars) {
		const airportId = star.uid.split(":")[0];
		const arr = starsByAirport.get(airportId) ?? [];
		arr.push(star);
		starsByAirport.set(airportId, arr);
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

function matchesProcedureId(dbId: string, filedId: string): boolean {
	if (dbId === filedId) return true;
	if (filedId.length === dbId.length + 1) return dbId === filedId.slice(0, 4) + filedId.slice(5);
	return false;
}

type FixCandidate = { uid: string; latitude: number; longitude: number };

function closestCandidate(candidates: FixCandidate[], near: { latitude: number; longitude: number } | null): FixCandidate {
	if (!near || candidates.length === 1) return candidates[0];

	let best = candidates[0];
	let bestDist = Infinity;

	for (const c of candidates) {
		const dlat = c.latitude - near.latitude;
		const dlon = c.longitude - near.longitude;
		const dist = dlat * dlat + dlon * dlon;
		if (dist < bestDist) {
			bestDist = dist;
			best = c;
		}
	}

	return best;
}

function lookupFix(id: string, near: { latitude: number; longitude: number } | null): FixCandidate | null {
	const candidates: FixCandidate[] = [];

	for (const wp of waypointsByName.get(id) ?? []) {
		candidates.push({ uid: wp.uid, latitude: wp.latitude, longitude: wp.longitude });
	}

	if (!candidates.length) return null;
	return closestCandidate(candidates, near);
}

// Return intermediate waypoints between entry and exit along an airway (exclusive of both endpoints)
function expandAirway(
	airway: NavigraphAirway,
	entryUid: string,
	exitUid: string,
	near: { latitude: number; longitude: number } | null,
): { point: PilotRoutePoint; pos: FixCandidate }[] {
	const entryIdx = airway.waypoints.indexOf(entryUid);
	const exitIdx = airway.waypoints.indexOf(exitUid);
	if (entryIdx === -1 || exitIdx === -1) return [];

	const step = entryIdx < exitIdx ? 1 : -1;
	const result: { point: PilotRoutePoint; pos: FixCandidate }[] = [];
	let pos = near;

	for (let j = entryIdx + step; j !== exitIdx; j += step) {
		const wpUid = airway.waypoints[j];
		const wpId = wpUid.split(":")[2];
		const fix = lookupFix(wpId, pos);
		if (fix) {
			result.push({ point: { uid: fix.uid, airwayUid: airway.uid }, pos: fix });
			pos = fix;
		}
	}

	return result;
}

export function parseRouteString(flightplan: VatsimPilotFlightPlan): PilotParsedRoute {
	if (!flightplan?.route) return { sid: null, star: null, waypoints: [] };

	const tokens = flightplan.route.trim().split(/\s+/).filter(Boolean);
	if (tokens.length === 0) return { sid: null, star: null, waypoints: [] };

	let startIdx = 0;
	let endIdx = tokens.length - 1;

	let sid: string[] | null = null;
	const depSids = sidsByAirport.get(flightplan.departure);
	if (depSids) {
		const first = tokens[0];
		const slashIdx = first.indexOf("/");
		const procName = slashIdx !== -1 ? first.slice(0, slashIdx) : stripConstraint(first);
		const runwaySuffix = slashIdx !== -1 ? first.slice(slashIdx + 1) : null;

		const matches = depSids.filter((s) => matchesProcedureId(s.id, procName));
		if (matches.length > 0) {
			const allMatch = matches.find((s) => s.uid.split(":")[2] === "ALL");
			if (allMatch) {
				startIdx = 1;
				if (runwaySuffix) {
					const rwId = `RW${runwaySuffix}`;
					const transMatch = depSids.find((s) => s.id === allMatch.id && s.uid.split(":")[2] === rwId);
					sid = transMatch ? [transMatch.uid, allMatch.uid] : [allMatch.uid];
				} else {
					sid = [allMatch.uid];
				}
			} else if (matches.length === 1) {
				startIdx = 1;
				sid = [matches[0].uid];
			}
		}
	}

	let starUid: string | null = null;
	let starId: string | null = null;
	let starHasMultiple = false;

	const arrStars = starsByAirport.get(flightplan.arrival);
	if (arrStars && endIdx >= startIdx) {
		const last = stripConstraint(tokens[endIdx]);
		const matches = arrStars.filter((s) => matchesProcedureId(s.id, last));

		if (matches.length > 0) {
			const allMatch = matches.find((s) => s.uid.split(":")[2] === "ALL");
			const picked = allMatch ?? (matches.length === 1 ? matches[0] : null);

			if (picked) {
				starUid = picked.uid;
				starId = picked.id;
				starHasMultiple = !!allMatch;
				endIdx--;
			}
		}
	}

	const depAirport = gatesByAirport.get(flightplan.departure);
	let lastPos: { latitude: number; longitude: number } | null = depAirport
		? { latitude: depAirport.latitude, longitude: depAirport.longitude }
		: null;

	const waypoints: PilotRoutePoint[] = [];
	let lastUid: string | null = null;
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
			waypoints.push({ uid: fixId });
			lastUid = fixId;
			lastPos = latLon;
			i++;
			continue;
		}

		if (airwaysByName.has(fixId) && lastUid && i + 1 <= endIdx) {
			const exitRawId = stripConstraint(tokens[i + 1]);

			const airways = airwaysByName.get(fixId) ?? [];
			let matchingAirway: NavigraphAirway | undefined;
			let exitUid: string | undefined;

			for (const aw of airways) {
				if (!aw.waypoints.includes(lastUid)) continue;
				const found = aw.waypoints.find((uid) => uid.split(":")[2] === exitRawId);
				if (found) {
					matchingAirway = aw;
					exitUid = found;
					break;
				}
			}

			if (matchingAirway && exitUid) {
				const expanded = expandAirway(matchingAirway, lastUid, exitUid, lastPos);
				for (const { point, pos } of expanded) {
					waypoints.push(point);
					lastPos = pos;
				}
				lastUid = exitUid;
				i++;
				continue;
			}
		}

		const fix = lookupFix(fixId, lastPos);
		if (fix) {
			waypoints.push({ uid: fix.uid });
			lastUid = fix.uid;
			lastPos = fix;
		}

		i++;
	}

	let star: string[] | null = null;
	if (starUid && starId) {
		star = [starUid];
		if (starHasMultiple && lastUid && arrStars) {
			const lastFixId = lastUid.split(":")[2];
			const transMatch = arrStars.find((s) => s.id === starId && s.uid.split(":")[2] === lastFixId);
			if (transMatch) star = [transMatch.uid, starUid];
		}
	}

	return { sid, star, waypoints };
}
