import type { VatglassesSector } from "@sr24/types/db";
import type { ControllerMerged } from "@sr24/types/interface";
import type { Coordinate } from "ol/coordinate";
import { MultiPolygon } from "ol/geom";
import { fromLonLat } from "ol/proj";
import { dxGetVatglassesDatasetByCode } from "@/storage/dexie";

function toArray<T>(val: T | T[] | undefined): T[] {
	if (!val) return [];
	return Array.isArray(val) ? val : [val];
}

export async function getVatglassesSectors(merged: ControllerMerged): Promise<{ sectors: VatglassesSector[]; color: string | null } | null> {
	const code = merged.id.replace("fir_", "").slice(0, 2).toLowerCase();
	const dataset = await dxGetVatglassesDatasetByCode(code);
	if (!dataset) return null;

	const posEntries = Object.entries(dataset.positions);
	const sectors: VatglassesSector[] = [];
	let color: string | null = null;

	for (const c of merged.controllers) {
		for (const [posId, pos] of posEntries) {
			if (pos.frequency && parseFloat(pos.frequency) * 1000 !== c.frequency) continue;
			if (!c.callsign.endsWith(pos.type)) continue;
			const pre = toArray(pos.pre);
			if (!pre.some((prefix) => c.callsign.startsWith(prefix))) continue;

			if (!color) {
				const colours = pos.colours?.filter((x) => x.hex) ?? [];
				color = colours.find((x) => !toArray(x.online).length)?.hex ?? colours[0]?.hex ?? null;
			}

			for (const as of dataset.airspace) {
				if (as.owner?.includes(posId)) {
					sectors.push(...getActiveSectors(as.sectors));
				}
			}
			break;
		}
	}

	return sectors.length ? { sectors, color } : null;
}

function getActiveSectors(sectors: VatglassesSector[]): VatglassesSector[] {
	return sectors.filter((s) => !s.runways);
}

function parseDms(dms: string): number {
	const neg = dms.startsWith("-");
	const abs = neg ? dms.slice(1) : dms;
	const padded = abs.padStart(7, "0");
	const ss = Number(padded.slice(-2));
	const mm = Number(padded.slice(-4, -2));
	const dd = Number(padded.slice(0, -4));
	const decimal = dd + mm / 60 + ss / 3600;
	return Math.round((neg ? -decimal : decimal) * 10000) / 10000;
}

export function getVatglassesMultipolygon(sectors: VatglassesSector[], altitude: number): MultiPolygon {
	const filteredSectors = sectors.filter((s) => (s.min ?? 0) <= altitude && (s.max ?? Infinity) >= altitude);
	const points: Coordinate[][][] = filteredSectors.map((s) => [s.points.map(([lat, lon]) => fromLonLat([parseDms(lon), parseDms(lat)]))]);
	return new MultiPolygon(points);
}
