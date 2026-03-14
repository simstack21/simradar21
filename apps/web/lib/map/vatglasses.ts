import type { VatglassesDataset, VatglassesDynamicOwnership, VatglassesSector } from "@sr24/types/db";
import type { ControllerMerged } from "@sr24/types/interface";
import type { Coordinate } from "ol/coordinate";
import { MultiPolygon } from "ol/geom";
import { fromLonLat } from "ol/proj";
import { dxGetVatglassesDatasetByCode } from "@/storage/dexie";

function toArray<T>(val: T | T[] | undefined): T[] {
	if (!val) return [];
	return Array.isArray(val) ? val : [val];
}

// cache dexie dataset for faster access and perf opt
const datasetPromises = new Map<string, Promise<VatglassesDataset | null>>();

function getDataset(code: string): Promise<VatglassesDataset | null> {
	let promise = datasetPromises.get(code);
	if (!promise) {
		promise = dxGetVatglassesDatasetByCode(code);
		datasetPromises.set(code, promise);
	}
	return promise;
}

// pre converted coordinates are saved in this, to opt performance
export type ConvertedSector = {
	min: number;
	max: number;
	points: Coordinate[];
};

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

// cover dynamic airspaces having numeric points
function toDecimal(v: string | number): number {
	return typeof v === "number" ? v : parseDms(v);
}

function convertSector(sector: VatglassesSector): ConvertedSector {
	return {
		min: sector.min ?? 0,
		max: sector.max ?? Infinity,
		points: sector.points.map(([lat, lon]) => fromLonLat([toDecimal(lon), toDecimal(lat)])),
	};
}

export function buildActivePositions(controllers: ControllerMerged[]): Map<string, Set<string>> {
	const result = new Map<string, Set<string>>();

	for (const merged of controllers) {
		if (!merged.datasetId) continue;

		for (const c of merged.controllers) {
			if (!c.posId) continue;
			if (!result.has(merged.datasetId)) result.set(merged.datasetId, new Set());
			result.get(merged.datasetId)?.add(c.posId);
		}
	}

	return result;
}

export async function getVatglassesSectors(
	merged: ControllerMerged,
	activePositions: Map<string, Set<string>>,
	dynamicOwnership: VatglassesDynamicOwnership | null,
): Promise<{ sectors: ConvertedSector[]; color: string | null } | null> {
	if (!merged.datasetId) return null;

	const dataset = await getDataset(merged.datasetId);
	if (!dataset) return null;

	const activeForCode = activePositions.get(merged.datasetId) ?? new Set<string>();
	const dynamicForCode = dynamicOwnership?.[merged.datasetId]?.airspace ?? null;
	const rawSectors: VatglassesSector[] = [];
	let color: string | null = null;

	for (const c of merged.controllers) {
		if (!c.posId) continue;
		const pos = dataset.positions[c.posId];
		if (!pos) continue;

		if (!color) {
			const colours = pos.colours?.filter((x) => x.hex) ?? [];
			// Take correct color, first matching active pos, otherwise first defined color
			color =
				colours.find((x) => {
					const online = toArray(x.online);
					return !online.length || online.every((id) => activeForCode.has(id));
				})?.hex ?? null;
		}

		for (const as of dataset.airspace) {
			// check for dynamic, otherwise use static
			const owner = (as.key ? dynamicForCode?.[as.key] : undefined) ?? as.owner;
			const firstActiveOwner = owner?.find((o) => activeForCode.has(o));
			if (firstActiveOwner === c.posId) {
				rawSectors.push(...as.sectors.filter((s) => !s.runways));
			}
		}
	}

	// pre convert coordinates once
	return rawSectors.length ? { sectors: rawSectors.map(convertSector), color } : null;
}

export function getVatglassesMultipolygon(sectors: ConvertedSector[], altitude: number): MultiPolygon {
	const filtered = sectors.filter((s) => s.min <= altitude && s.max >= altitude);
	return new MultiPolygon(filtered.map((s) => [s.points]));
}
