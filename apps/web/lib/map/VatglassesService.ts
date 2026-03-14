import type { VatglassesDynamicOwnership } from "@sr24/types/db";
import type { ControllerMerged } from "@sr24/types/interface";
import { Feature } from "ol";
import type { MultiPolygon, Point, Polygon } from "ol/geom";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { fetchApi } from "../api";
import { stripPrefix } from "./controllers";
import { getVatglassesStyle } from "./styles/vatglasses";
import { buildActivePositions, type ConvertedSector, getVatglassesMultipolygon, getVatglassesSectors } from "./vatglasses";

type CachedSector = {
	sectors: ConvertedSector[];
	color: string | null;
};

export class VatglassesService {
	constructor(private getControllers: () => ControllerMerged[]) {}

	private source = new VectorSource<Feature<MultiPolygon | Polygon>>({
		useSpatialIndex: false,
	});
	private layer: VectorLayer | null = null;

	private cachedSectors = new Map<string, CachedSector>();
	private controllerKey = "";
	private dynamicOwnership: VatglassesDynamicOwnership | null = null;
	private dynamicOwnershipInterval: NodeJS.Timeout | null = null;

	private altitude: number = 200;
	private vatglassesEnabled: boolean | undefined;
	private altitudeRafId: number | null = null;

	private hoveredId: string | null = null;
	private clickedIds = new Set<string>();

	public init(): VectorLayer {
		this.layer = new VectorLayer({
			source: this.source,
			style: getVatglassesStyle(),
			properties: {
				type: "vatglasses",
			},
			zIndex: 1,
		});

		return this.layer;
	}

	public setVatglassesEnabled(enabled: boolean): void {
		if (this.vatglassesEnabled === enabled) return;
		this.vatglassesEnabled = enabled;

		if (!enabled) {
			this.clearSource();
		} else {
			this.fetchDynamicOwnership();
			this.dynamicOwnershipInterval = setInterval(() => this.fetchDynamicOwnership(), 60_000);
			this.setFeatures(this.getControllers());
		}
	}

	private async fetchDynamicOwnership(): Promise<void> {
		try {
			const ownership = await fetchApi<VatglassesDynamicOwnership | null>("/data/vatglasses/dynamic");
			if (!ownership) return;

			const changed = JSON.stringify(ownership) !== JSON.stringify(this.dynamicOwnership);
			this.dynamicOwnership = ownership;

			if (changed) {
				this.controllerKey = "";
				this.setFeatures(this.getControllers());
			}
		} catch {
			// keep last
		}
	}

	public async setFeatures(controllers: ControllerMerged[]): Promise<void> {
		if (this.vatglassesEnabled !== true) return;

		const newKey = controllers.map((c) => c.id).join(",");
		if (newKey !== this.controllerKey) {
			this.controllerKey = newKey;
			this.cachedSectors.clear();

			const activePositions = buildActivePositions(controllers);

			await Promise.all(
				controllers.map(async (merged) => {
					const result = await getVatglassesSectors(merged, activePositions, this.dynamicOwnership);
					if (result) {
						this.cachedSectors.set(merged.id, result);
					}
				}),
			);
		}

		this.renderFeatures(controllers);
	}

	private renderFeatures(controllers: ControllerMerged[]): void {
		if (this.vatglassesEnabled !== true) return;
		const features: Feature<MultiPolygon | Polygon>[] = [];

		for (const merged of controllers) {
			const cached = this.cachedSectors.get(merged.id);
			if (!cached) continue;

			const multipolygon = getVatglassesMultipolygon(cached.sectors, this.altitude);
			const feature = new Feature(multipolygon);

			const featureId = `sector_${stripPrefix(merged.id)}`;
			feature.setId(featureId);
			feature.set("color", cached.color);
			feature.set("hovered", this.hoveredId === featureId);
			feature.set("clicked", this.clickedIds.has(featureId));

			features.push(feature);
		}

		this.source.clear();
		this.source.addFeatures(features);
	}

	private clearSource(): void {
		if (this.altitudeRafId !== null) {
			cancelAnimationFrame(this.altitudeRafId);
			this.altitudeRafId = null;
		}
		if (this.dynamicOwnershipInterval !== null) {
			clearInterval(this.dynamicOwnershipInterval);
			this.dynamicOwnershipInterval = null;
		}

		this.hoveredId = null;
		this.clickedIds.clear();

		this.controllerKey = "";
		this.source.clear();
	}

	// incl debounce
	public setAltitude(altitude: number): void {
		this.altitude = altitude;
		if (!this.vatglassesEnabled) return;

		if (this.altitudeRafId !== null) cancelAnimationFrame(this.altitudeRafId);

		this.altitudeRafId = requestAnimationFrame(() => {
			this.altitudeRafId = null;
			this.renderFeatures(this.getControllers());
		});
	}

	public hoverSector(feature: Feature<Point> | undefined | null, hovered: boolean, event: "hovered" | "clicked"): void {
		const id = feature?.getId()?.toString();
		if (!id) return;

		if (event === "hovered") {
			this.hoveredId = hovered ? id : null;
		} else {
			hovered ? this.clickedIds.add(id) : this.clickedIds.delete(id);
		}

		const multiFeature = this.source.getFeatureById(id);
		multiFeature?.set(event, hovered);
	}
}
