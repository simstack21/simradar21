import type { VatglassesSector } from "@sr24/types/db";
import type { ControllerMerged } from "@sr24/types/interface";
import { Feature } from "ol";
import type { MultiPolygon, Polygon } from "ol/geom";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { getVatglassesStyle } from "./styles/vatglasses";
import { buildActivePositions, getVatglassesMultipolygon, getVatglassesSectors } from "./vatglasses";

type CachedSector = {
	sectors: VatglassesSector[];
	color: string | null;
};

export class VatglassesService {
	constructor(private getControllers: () => ControllerMerged[]) {}

	private source = new VectorSource<Feature<MultiPolygon | Polygon>>({
		useSpatialIndex: false,
	});
	private layer: VectorLayer | null = null;

	private cachedSectors = new Map<string, CachedSector>();

	private altitude: number = 24000;
	private vatglassesEnabled: boolean | undefined;

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
		const features: Feature<MultiPolygon | Polygon>[] = [];

		const activePositions = await buildActivePositions(controllers);
		this.cachedSectors.clear();

		await Promise.all(
			controllers.map(async (merged) => {
				const cached = this.cachedSectors.get(merged.id);
				let sectors: VatglassesSector[];
				let color: string | null = null;

				if (cached) {
					sectors = cached.sectors;
					color = cached.color;
				} else {
					const result = await getVatglassesSectors(merged, activePositions);
					if (!result) return;

					sectors = result.sectors;
					color = result.color;
					this.cachedSectors.set(merged.id, { sectors, color });
				}

				const multipolygon = getVatglassesMultipolygon(sectors, this.altitude);
				const feature = new Feature(multipolygon);
				feature.set("color", color);
				features.push(feature);
			}),
		);

		this.source.clear();
		this.source.addFeatures(features);
	}

	public setAltitude(altitude: number): void {
		this.altitude = altitude;
		void this.setFeatures(this.getControllers());
	}
}
