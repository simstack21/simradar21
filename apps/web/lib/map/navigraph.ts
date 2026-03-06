import type { PilotRouteProcedure } from "@sr24/types/interface";
import type { NavigraphWaypoint } from "@sr24/types/navigraph";
import {
	dxGetNavigraphAirport,
	dxGetNavigraphApproachesByAirport,
	dxGetNavigraphProceduresByAirport,
	dxGetNavigraphWaypoint,
	dxGetNavigraphWaypoints,
} from "@/storage/dexie";

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

export function getLonLatPoint(token: string): NavigraphWaypoint | undefined {
	const latLon = parseLatLon(token);
	if (!latLon) return;
	return { uid: token, id: token, name: token, latitude: latLon.latitude, longitude: latLon.longitude, class: "INT" };
}

export async function getSidPoints(proc: PilotRouteProcedure): Promise<NavigraphWaypoint[]> {
	const waypoints: NavigraphWaypoint[] = [];

	const airport = await dxGetNavigraphAirport(proc.airport);
	const runway = airport?.runways.find((rw) => rw.id === proc.rwy);
	if (runway && airport) {
		waypoints.push({
			uid: `${airport.id}:${runway.id}`,
			id: runway.id,
			name: runway.id,
			latitude: runway.latitude,
			longitude: runway.longitude,
			class: "INT",
		});
	}
	if (!runway && airport) {
		waypoints.push({
			uid: `${airport.id}`,
			id: airport.id,
			name: airport.id,
			latitude: airport.latitude,
			longitude: airport.longitude,
			class: "INT",
		});
	}

	const procedures = await dxGetNavigraphProceduresByAirport("sids", proc.airport);
	const uids: string[] = [];
	for (const uid of [proc.rwyCon, proc.proc, proc.trans]) {
		if (!uid) continue;
		const procedure = procedures.find((p) => p.uid === uid);
		if (procedure) uids.push(...procedure.waypoints);
	}
	if (uids.length === 0) return waypoints;

	const sidPoints = await dxGetNavigraphWaypoints(uids);
	waypoints.push(...sidPoints.filter((p): p is NavigraphWaypoint => !!p));
	return waypoints;
}

export async function getStarPoints(proc: PilotRouteProcedure): Promise<NavigraphWaypoint[]> {
	const procedures = await dxGetNavigraphProceduresByAirport("stars", proc.airport);
	const uids: string[] = [];
	for (const uid of [proc.trans, proc.proc, proc.rwyCon]) {
		if (!uid) continue;
		const procedure = procedures.find((p) => p.uid === uid);
		if (procedure) uids.push(...procedure.waypoints);
	}
	if (uids.length === 0) return [];

	const waypoints = (await dxGetNavigraphWaypoints(uids)).filter((p): p is NavigraphWaypoint => !!p);

	return waypoints;
}

export async function getApproachPoints(proc: PilotRouteProcedure): Promise<NavigraphWaypoint[]> {
	const approaches = await dxGetNavigraphApproachesByAirport(proc.airport);
	const waypoints: NavigraphWaypoint[] = [];

	for (const uid of [proc.approachTrans, proc.approach, proc.missedApproach]) {
		if (!uid) continue;
		const procedure = approaches.find((p) => p.uid === uid);
		if (!procedure) continue;

		for (const proc of procedure.waypoints) {
			if (proc.uid) {
				const point = await dxGetNavigraphWaypoint(proc.uid);
				if (point) waypoints.push(point);
			} else {
				waypoints.push({
					uid: proc.id || `${proc.latitude}:${proc.longitude}`,
					id: proc.id || "UNKNOWN",
					name: proc.id || "UNKNOWN",
					latitude: proc.latitude || 0,
					longitude: proc.longitude || 0,
					class: "INT",
				});
			}
		}
	}

	const airport = await dxGetNavigraphAirport(proc.airport);
	const runway = airport?.runways.find((rw) => rw.id === proc.rwy);

	if (runway && airport) {
		waypoints.push({
			uid: `${airport.id}:${runway.id}`,
			id: runway.id,
			name: runway.id,
			latitude: runway.latitude,
			longitude: runway.longitude,
			class: "INT",
		});
	}
	if (!runway && airport) {
		waypoints.push({
			uid: `${airport.id}`,
			id: airport.id,
			name: airport.id,
			latitude: airport.latitude,
			longitude: airport.longitude,
			class: "INT",
		});
	}

	return waypoints;
}
