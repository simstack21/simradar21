import type { NavigraphWaypoint } from "@sr24/types/navigraph";

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
