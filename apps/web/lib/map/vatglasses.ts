import type { VatglassesDataset, VatglassesDynamicOwnership, VatglassesSector } from "@sr24/types/db";
import type { ControllerMerged } from "@sr24/types/interface";
import type { Coordinate } from "ol/coordinate";
import { MultiPolygon } from "ol/geom";
import { fromLonLat } from "ol/proj";
import { dxFindVatglassesDatasetByPrefix, dxGetVatglassesDatasetByCode } from "@/storage/dexie";

function toArray<T>(val: T | T[] | undefined): T[] {
	if (!val) return [];
	return Array.isArray(val) ? val : [val];
}

function getCode(mergedId: string): string {
	return mergedId.replace(/^[^_]+_/, "").toLowerCase();
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

async function resolveDataset(code: string): Promise<{ dataset: VatglassesDataset; resolvedCode: string } | null> {
	const candidates = [code.slice(0, 2), code.slice(0, 3), code.split("-")[0]];

	for (const candidate of candidates) {
		if (!candidate) continue;
		const dataset = await getDataset(candidate);
		if (dataset) return { dataset, resolvedCode: candidate };
	}

	// fallback: shared datasets like "bi-bg" where the 2-letter prefix is one segment
	const prefix = code.slice(0, 2);
	const shared = await dxFindVatglassesDatasetByPrefix(prefix);
	if (shared) return { dataset: shared, resolvedCode: shared.code };

	return null;
}

// pre onverted coordinates are save in this, to opt performance
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

export async function buildActivePositions(controllers: ControllerMerged[]): Promise<Map<string, Set<string>>> {
	const result = new Map<string, Set<string>>();

	await Promise.all(
		controllers.map(async (merged) => {
			const code = getCode(merged.id);
			const resolved = await resolveDataset(code);
			if (!resolved) return;

			const { dataset, resolvedCode } = resolved;

			const posEntries = Object.entries(dataset.positions);
			for (const c of merged.controllers) {
				for (const [posId, pos] of posEntries) {
					if (pos.frequency && Math.round(parseFloat(pos.frequency) * 1000) !== c.frequency) continue;
					if (!c.callsign.endsWith(pos.type)) continue;

					const pre = toArray(pos.pre);
					if (!pre.some((prefix) => c.callsign.startsWith(prefix))) continue;
					if (!result.has(resolvedCode)) result.set(resolvedCode, new Set());
					result.get(resolvedCode)?.add(posId);

					break;
				}
			}
		}),
	);

	return result;
}

export async function getVatglassesSectors(
	merged: ControllerMerged,
	activePositions: Map<string, Set<string>>,
	dynamicOwnership: VatglassesDynamicOwnership | null,
): Promise<{ sectors: ConvertedSector[]; color: string | null } | null> {
	const code = getCode(merged.id);
	const resolved = await resolveDataset(code);
	if (!resolved) return null;

	const { dataset, resolvedCode } = resolved;

	const posEntries = Object.entries(dataset.positions);
	const activeForCode = activePositions.get(resolvedCode) ?? new Set<string>();
	const dynamicForCode = dynamicOwnership?.[resolvedCode]?.airspace ?? null;
	const rawSectors: VatglassesSector[] = [];
	let color: string | null = null;

	for (const c of merged.controllers) {
		for (const [posId, pos] of posEntries) {
			if (pos.frequency && Math.round(parseFloat(pos.frequency) * 1000) !== c.frequency) continue;
			if (!c.callsign.endsWith(pos.type)) continue;

			const pre = toArray(pos.pre);
			if (!pre.some((prefix) => c.callsign.startsWith(prefix))) continue;

			if (!color) {
				const colours = pos.colours?.filter((x) => x.hex) ?? [];
				// Take correct color, first matching active pos, otherswise first defined color
				color =
					colours.find((x) => {
						const online = toArray(x.online);
						return !online.length || online.every((id) => activeForCode.has(id));
					})?.hex ?? null;
			}

			for (const as of dataset.airspace) {
				// check fpr dynamic, otherwise use static
				const owner = (as.key ? dynamicForCode?.[as.key] : undefined) ?? as.owner;
				const firstActiveOwner = owner?.find((o) => activeForCode.has(o));
				if (firstActiveOwner === posId) {
					rawSectors.push(...as.sectors.filter((s) => !s.runways));
				}
			}

			break;
		}
	}

	// pre convert coordinates once
	return rawSectors.length ? { sectors: rawSectors.map(convertSector), color } : null;
}

export function getVatglassesMultipolygon(sectors: ConvertedSector[], altitude: number): MultiPolygon {
	const filtered = sectors.filter((s) => s.min <= altitude && s.max >= altitude);
	return new MultiPolygon(filtered.map((s) => [s.points]));
}
