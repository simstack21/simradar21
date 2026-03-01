import { rdsGetSingle } from "@sr24/db/redis";
import type { NavigraphPackage } from "@sr24/types/db";
import type { NavigraphAirport, NavigraphDataset } from "@sr24/types/navigraph";

let gatesByAirport: Map<string, NavigraphAirport> = new Map();
let loadedCycle: string | null = null;

export async function ensureNavigraphData(): Promise<void> {
	const pkg = (await rdsGetSingle("navigraph:package:current")) as NavigraphPackage | null;
	if (!pkg || pkg.cycle === loadedCycle) return;

	const dataset = (await rdsGetSingle("navigraph:data:current")) as NavigraphDataset | null;
	if (!dataset) return;

	gatesByAirport = new Map(dataset.airports.map((a) => [a.id, a]));
	loadedCycle = pkg.cycle;
}

export function getAirportGates(icao: string): NavigraphAirport | undefined {
	return gatesByAirport.get(icao);
}
