import type { VatglassesSector } from "@sr24/types/db";
import type { ControllerMerged } from "@sr24/types/interface";
import type { Coordinate } from "ol/coordinate";
import { MultiPolygon } from "ol/geom";
import { fromLonLat } from "ol/proj";
import { dxGetVatglassesDatasetByCode } from "@/storage/dexie";

const getBase = (callsign: string) => callsign.replaceAll(/__|_/g, "-").split("-").slice(0, -1).join("-");

export async function getVatglassesSectors(merged: ControllerMerged): Promise<{ sectors: VatglassesSector[]; color: string | null } | null> {
	const code = merged.id.replace("fir_", "").slice(0, 2);
	const dataset = await dxGetVatglassesDatasetByCode(code.toLowerCase());
	const posEntries = Object.entries(dataset?.positions || {});

	if (!dataset) return null;

	const sectors: VatglassesSector[] = [];
	let color: string | null = null;

	for (const c of merged.controllers) {
		const base = getBase(c.callsign);
		let match: string | null = null;

		for (const [key, value] of posEntries) {
			if (value.pre.includes(base)) {
				color = value.colour || null;
				match = key;
				break;
			}
		}

		if (!match) continue;

		for (const as of dataset.airspace) {
			if (as.owner.includes(match)) {
				sectors.push(...as.sectors);
			}
		}
	}

	return { sectors, color };
}

export function getVatglassesMultipolygon(sectors: VatglassesSector[], altitude: number): MultiPolygon {
	const filteredSectors = sectors.filter((s) => (s.min ?? 0) <= altitude && (s.max ?? Infinity) >= altitude);
	const points: Coordinate[][][] = filteredSectors.map((s) => [s.points.map((point) => fromLonLat(point))]);
	return new MultiPolygon(points);
}
