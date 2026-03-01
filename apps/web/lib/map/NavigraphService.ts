import { Feature } from "ol";
import type { Extent } from "ol/extent";
import { Point } from "ol/geom";
import VectorLayer from "ol/layer/Vector";
import { fromLonLat, transformExtent } from "ol/proj";
import VectorSource from "ol/source/Vector";
import RBush from "rbush";
import { dxGetAllAirports, dxGetNavigraphAirports } from "@/storage/dexie";
import { getNavigraphGateStyle, type NavigraphStyleVars } from "./styles/navigraph";

type RBushAirport = {
	minX: number;
	minY: number;
	maxX: number;
	maxY: number;
	id: string;
};

export class NavigraphService {
	private source = new VectorSource<Feature<Point>>({
		useSpatialIndex: false,
	});
	private layer: VectorLayer | null = null;

	private rbush = new RBush<RBushAirport>();
	private cachedAirports = new Set<string>();

	private styleVars: NavigraphStyleVars = {};

	public init(): VectorLayer {
		this.initRBush();
		this.layer = new VectorLayer({
			source: this.source,
			style: getNavigraphGateStyle(this.styleVars),
			properties: {
				type: "navigraph",
			},
			declutter: true,
			zIndex: 3,
		});

		return this.layer;
	}

	private async initRBush() {
		const airports = await dxGetAllAirports();
		const items: RBushAirport[] = airports.map((a) => ({
			minX: a.longitude,
			minY: a.latitude,
			maxX: a.longitude,
			maxY: a.latitude,
			id: a.id,
		}));
		this.rbush.load(items);
	}

	public setTheme(theme: boolean) {
		this.styleVars.theme = theme;
		this.layer?.setStyle(getNavigraphGateStyle(this.styleVars));
	}

	public async renderFeatures(extent: Extent, resolution: number) {
		if (resolution > 10) {
			this.source.clear();
			this.cachedAirports.clear();
			return;
		}
		if (this.cachedAirports.size > 0) return;

		const [minX, minY, maxX, maxY] = transformExtent(extent, "EPSG:3857", "EPSG:4326");
		const airports = this.rbush.search({ minX, minY, maxX, maxY });

		const ngAirports = await dxGetNavigraphAirports(airports.map((a) => a.id));
		const features: Feature<Point>[] = [];

		ngAirports.forEach((a) => {
			if (!a) return;
			this.cachedAirports.add(a.id);

			a.gates.forEach((gate) => {
				const feature = new Feature({
					geometry: new Point(fromLonLat([gate.longitude, gate.latitude])),
					label: gate.id,
					blocked: false, // TODO: implement blocked status
				});
				feature.setId(`navigraph_gate_${a.id}_${gate.id}`);
				features.push(feature);
			});
		});
		this.source.addFeatures(features);
	}
}
