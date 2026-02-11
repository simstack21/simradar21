import type { FIRFeature, SimAwareTraconFeature } from "@sr24/types/db";
import type { PilotLong } from "@sr24/types/interface";
import { getCachedFir, getCachedTracon } from "@/storage/cache";
import type { SectorPanelData } from "@/types/panels";

export function getDelayColorFromDates(scheduled: number | undefined, actual: number | undefined): "green" | "yellow" | "red" | null {
	if (!scheduled || !actual) return null;

	const delayMinutes = (actual - scheduled) / 60000;
	if (delayMinutes >= 30) {
		return "red";
	} else if (delayMinutes >= 15) {
		return "yellow";
	} else if (delayMinutes > 0) {
		return "green";
	}
	return "green";
}

export function getDelayColorFromNumber(avgDelay: number): "green" | "yellow" | "red" | null {
	if (avgDelay >= 60) {
		return "red";
	} else if (avgDelay >= 30) {
		return "yellow";
	} else if (avgDelay > 0) {
		return "green";
	}
	return "green";
}

export function getControllerColor(facility: number): "yellow" | "blue" | "green" | "red" | "purple" | "grey" {
	switch (facility) {
		case -1:
			return "yellow";
		case 2:
			return "blue";
		case 3:
			return "green";
		case 4:
			return "red";
		case 5:
			return "purple";
		case 6:
			return "grey";
		default:
			return "yellow";
	}
}

export const pilotAirportTimeMapping = {
	departure: ["sched_off_block", "off_block"] as const,
	arrival: ["sched_on_block", "on_block"] as const,
};

export function getPilotTimeStatus(times: PilotLong["times"]): { departure: boolean; arrival: boolean } {
	if (!times) {
		return { departure: false, arrival: false };
	}
	let departure = false;
	let arrival = false;

	const now = new Date();
	if (new Date(times.off_block) < now) {
		departure = true;
	}
	if (new Date(times.on_block) < now) {
		arrival = true;
	}
	return { departure, arrival };
}

export async function getSectorFeature(callsign: string): Promise<SectorPanelData | null> {
	let feature: SimAwareTraconFeature | FIRFeature | null = null;
	let type: "tracon" | "fir" | null = null;

	feature = await getCachedTracon(callsign);
	type = "tracon";
	if (!feature) {
		feature = await getCachedFir(callsign);
		type = "fir";
	}
	if (!feature) return null;

	return { feature, type };
}
