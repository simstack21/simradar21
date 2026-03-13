import type { ControllerMerged } from "@sr24/types/interface";
import { Feature } from "ol";
import type { MultiPolygon, Polygon } from "ol/geom";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
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

	private altitude: number = 200;
	private vatglassesEnabled: boolean | undefined;
	private altitudeRafId: number | null = null;

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
		this.vatglassesEnabled = enabled;
		if (!enabled) {
			this.source.clear();
		} else {
			void this.setFeatures(this.getControllers());
		}
	}

	public async setFeatures(controllers: ControllerMerged[]): Promise<void> {
		if (this.vatglassesEnabled !== true) return;

		const newKey = controllers.map((c) => c.id).join(",");
		if (newKey !== this.controllerKey) {
			this.controllerKey = newKey;
			this.cachedSectors.clear();

			const activePositions = await buildActivePositions(controllers);

			await Promise.all(
				controllers.map(async (merged) => {
					const result = await getVatglassesSectors(merged, activePositions);
					if (result) {
						this.cachedSectors.set(merged.id, result);
					}
				}),
			);
		}

		this.renderFeatures(controllers);
	}

	private renderFeatures(controllers: ControllerMerged[]): void {
		const features: Feature<MultiPolygon | Polygon>[] = [];

		for (const merged of controllers) {
			const cached = this.cachedSectors.get(merged.id);
			if (!cached) continue;

			const multipolygon = getVatglassesMultipolygon(cached.sectors, this.altitude);
			const feature = new Feature(multipolygon);
			feature.set("color", cached.color);
			features.push(feature);
		}

		this.source.clear();
		this.source.addFeatures(features);
	}

	// incl debounce
	public setAltitude(altitude: number): void {
		this.altitude = altitude;
		if (this.altitudeRafId !== null) cancelAnimationFrame(this.altitudeRafId);

		this.altitudeRafId = requestAnimationFrame(() => {
			this.altitudeRafId = null;
			this.renderFeatures(this.getControllers());
		});
	}
}
