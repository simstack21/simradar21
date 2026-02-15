import type { PilotDelta, PilotShort } from "@sr24/types/interface";
import { Feature, type View } from "ol";
import type { Extent } from "ol/extent";
import { Point } from "ol/geom";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import RBush from "rbush";
import { toast } from "sonner";
import type { PilotProperties } from "@/types/ol";
import type { FilterValues } from "@/types/zustand";
import { getPilotStyle, getShadowStyle, type PilotStyleVars } from "./styles/pilot";

type RBushFeature = {
	minX: number;
	minY: number;
	maxX: number;
	maxY: number;
	altitude_agl: number;
	feature: Feature<Point>;
};

export class PilotService {
	private source = new VectorSource<Feature<Point>>({
		useSpatialIndex: false,
	});
	private mainLayer: VectorLayer | null = null;
	private shadowLayer: VectorLayer | null = null;

	private rbush = new RBush<RBushFeature>();
	private map = new Map<string, RBushFeature>();
	private rendered = new Set<string>();
	private renderPending = false;

	private filters: FilterValues | null = null;
	private highlighted = new Set<string>();
	private focused = new Set<string>();
	private isFocused = false;
	// private viewInitialized = false;

	private moving = new Set<Feature<Point>>();

	private styleVars: PilotStyleVars = {};

	public init(): VectorLayer[] {
		this.mainLayer = new VectorLayer({
			source: this.source,
			style: getPilotStyle(this.styleVars),
			properties: {
				type: "pilot_main",
			},
			declutter: true,
			zIndex: 5,
		});
		this.shadowLayer = new VectorLayer({
			source: this.source,
			style: getShadowStyle(this.styleVars),
			properties: {
				type: "pilot_shadow",
			},
			zIndex: 4,
		});

		return [this.mainLayer, this.shadowLayer];
	}

	public getSource(): VectorSource<Feature<Point>> {
		return this.source;
	}

	public setTheme(theme: boolean) {
		this.styleVars.theme = theme;
		this.shadowLayer?.setStyle(getShadowStyle(this.styleVars));
	}

	public setFilters(filters: FilterValues) {
		this.filters = filters;
	}

	private filterFeature(feature: Feature<Point>): boolean {
		if (!this.filters) return true;

		const callsign = feature.get("callsign") as string | undefined;
		if (this.filters.airline.length > 0 && !this.filters.airline.some((f) => f === callsign?.slice(0, 3))) {
			return false;
		}
		if (this.filters.callsign.length > 0 && !this.filters.callsign.some((filter) => callsign?.includes(filter))) {
			return false;
		}

		const type = feature.get("aircraft") as string | undefined;
		if (this.filters.type.length > 0 && !this.filters.type.some((filter) => type === filter)) {
			return false;
		}

		const registration = feature.get("ac_reg") as string | undefined;
		if (this.filters.registration.length > 0 && !this.filters.registration.some((filter) => registration?.includes(filter))) {
			return false;
		}

		const route = feature.get("route") as string | undefined;
		const airports = route?.split(" ") || [];
		if (this.filters.departure.length > 0 && !this.filters.departure.some((filter) => filter === airports[0])) {
			return false;
		}
		if (this.filters.arrival.length > 0 && !this.filters.arrival.some((filter) => filter === airports[1])) {
			return false;
		}
		if (this.filters.anyAirport.length > 0 && !this.filters.anyAirport.some((filter) => filter === airports[0] || filter === airports[1])) {
			return false;
		}

		const altitude = feature.get("altitude_ms") as number | undefined;
		const [minAlt, maxAlt] = this.filters.altitude;
		if (altitude === undefined || altitude < minAlt || altitude > maxAlt) {
			return false;
		}

		const groundspeed = feature.get("groundspeed") as number | undefined;
		const [minSpd, maxSpd] = this.filters.groundspeed;
		if (groundspeed === undefined || groundspeed < minSpd || groundspeed > maxSpd) {
			return false;
		}

		const squawk = feature.get("transponder") as string | undefined;
		if (this.filters.squawk.length > 0 && !this.filters.squawk.some((filter) => filter === squawk)) {
			return false;
		}

		const rules = feature.get("flight_rules") as string | undefined;
		if (this.filters.rules.length > 0 && !this.filters.rules.some((filter) => filter === rules)) {
			return false;
		}

		return true;
	}

	public addHighlighted(id: string): void {
		this.highlighted.add(id);
	}

	public removeHighlighted(id: string): void {
		this.highlighted.delete(id);
	}

	public clearHighlighted(): void {
		this.highlighted.clear();
	}

	public setFeatures(pilots: PilotShort[]) {
		this.rbush.clear();
		this.map.clear();

		for (const p of pilots) {
			if (!p.coordinates) continue;

			const { vx, vy } = this.calculateVelocities(p);

			const props: PilotProperties = {
				type: "pilot",
				clicked: false,
				hovered: false,
				vx,
				vy,
				...p,
			};

			const feature = new Feature({
				geometry: new Point(p.coordinates),
			});
			feature.setProperties(props);
			feature.setId(`pilot_${p.id}`);

			const newItem: RBushFeature = {
				minX: p.coordinates[0],
				minY: p.coordinates[1],
				maxX: p.coordinates[0],
				maxY: p.coordinates[1],
				altitude_agl: p.altitude_agl || 0,
				feature,
			};

			this.map.set(p.id, newItem);
			this.rbush.insert(newItem);
		}
	}

	public updateFeatures(delta: PilotDelta): string[] {
		const pilotsInDelta = new Set<string>();

		for (const p of delta.updated) {
			const item = this.map.get(p.id);
			if (!item) continue;

			pilotsInDelta.add(p.id);

			if (Object.keys(p).length === 1) continue;

			for (const k in p) {
				item.feature.set(k, p[k as keyof typeof p], true);
			}

			if (p.groundspeed && p.heading) {
				const { vx, vy } = this.calculateVelocities(p);
				item.feature.set("vx", vx, true);
				item.feature.set("vy", vy, true);
			}

			if (p.coordinates) {
				const geom = item.feature.getGeometry();
				geom?.setCoordinates(p.coordinates);

				item.feature.set("coord3857", p.coordinates, true);
				this.rbush.remove(item);
				item.minX = item.maxX = p.coordinates[0];
				item.minY = item.maxY = p.coordinates[1];
				this.rbush.insert(item);
			}

			this.map.set(p.id, item);
		}

		for (const p of delta.added) {
			if (pilotsInDelta.has(p.id)) continue;

			pilotsInDelta.add(p.id);

			const { vx, vy } = this.calculateVelocities(p);

			const props: PilotProperties = {
				type: "pilot",
				clicked: false,
				hovered: false,
				vx,
				vy,
				...p,
			};
			const feature = new Feature({
				geometry: new Point(p.coordinates),
			});
			feature.setProperties(props);
			feature.setId(`pilot_${p.id}`);

			const newItem: RBushFeature = {
				minX: p.coordinates[0],
				minY: p.coordinates[1],
				maxX: p.coordinates[0],
				maxY: p.coordinates[1],
				altitude_agl: p.altitude_agl || 0,
				feature,
			};

			this.map.set(p.id, newItem);
			this.rbush.insert(newItem);
		}

		const toRemove: string[] = [];

		for (const item of this.map) {
			if (pilotsInDelta.has(item[0])) continue;
			toRemove.push(item[0]);
			this.rbush.remove(item[1]);
		}

		for (const id of toRemove) {
			this.map.delete(id);
		}

		const removedIds: string[] = [];

		if (this.highlighted.size > 0) {
			for (const id of this.highlighted) {
				if (!this.map.has(id)) {
					toast.error("Pilot Disconnected", { description: `A viewed pilot has disconnected.` });
					this.highlighted.delete(id);
					removedIds.push(`pilot_${id}`);
				}
			}
		}

		return removedIds;
	}

	private calculateVelocities(pilot: PilotShort): { vx: number; vy: number } {
		const kts = pilot.groundspeed ?? 0;
		const heading = pilot.heading ?? 0;

		if (kts > 0) {
			const speed = kts * 0.514444;
			const rad = (heading * Math.PI) / 180;

			return {
				vx: Math.sin(rad) * speed,
				vy: Math.cos(rad) * speed,
			};
		}
		return { vx: 0, vy: 0 };
	}

	public renderFeatures(extent: Extent, resolution: number) {
		if (this.renderPending) return;
		this.renderPending = true;

		if (this.isFocused) {
			const newFeatures: Feature<Point>[] = [];

			this.focused.forEach((id) => {
				const feature = this.map.get(id);
				if (feature?.feature) {
					newFeatures.push(feature.feature);
				}
			});

			this.source.clear();
			this.source.addFeatures(newFeatures);

			this.rendered = new Set(newFeatures.map((f) => f.getId() as string));
			this.renderPending = false;
			return;
		}

		const pilotsByExtent = this.rbush.search({
			minX: extent[0],
			minY: extent[1],
			maxX: extent[2],
			maxY: extent[3],
		});

		const limited: RBushFeature[] = [];

		for (const p of pilotsByExtent) {
			if (resolution > 25 && p.altitude_agl <= 200) continue;
			if (!this.filterFeature(p.feature)) continue;

			limited.push(p);

			if (limited.length > 300) {
				limited.sort((a, b) => b.altitude_agl - a.altitude_agl);
				limited.length = 300;
			}
		}

		const newFeatures = limited.map((p) => p.feature);
		const idSet = new Set(newFeatures.map((f) => f.getId()));

		this.highlighted.forEach((id) => {
			const fid = `pilot_${id}`;
			if (!idSet.has(fid)) {
				const item = this.map.get(id);
				if (item) newFeatures.push(item.feature);
			}
		});

		const next = new Set(newFeatures.map((f) => f.getId() as string));

		this.rendered.forEach((id) => {
			if (!next.has(id)) {
				const f = this.source.getFeatureById(id);
				if (f) {
					this.source.removeFeature(f);
					this.moving.delete(f);
				}
			}
		});

		newFeatures.forEach((f) => {
			const id = f.getId() as string;
			if (!this.rendered.has(id)) {
				this.source.addFeature(f);

				const vx = f.get("vx");
				const vy = f.get("vy");
				if (vx !== 0 || vy !== 0) {
					this.moving.add(f);
				}
			}
		});

		this.rendered = next;
		this.renderPending = false;
	}

	public animateFeatures(elapsed: number): void {
		const dt = elapsed / 1000;

		for (const f of this.moving) {
			const vx = f.get("vx");
			const vy = f.get("vy");
			if (!vx || !vy || (vx === 0 && vy === 0)) continue;

			const geom = f.getGeometry();
			if (!geom) continue;

			const coords = geom.getCoordinates();

			coords[0] += vx * dt;
			coords[1] += vy * dt;

			geom.setCoordinates(coords);
		}
	}

	public moveToFeature(id: string, view?: View | undefined): Feature<Point> | null {
		let feature = this.source.getFeatureById(`pilot_${id}`) as Feature<Point> | undefined;
		if (!feature) {
			const item = this.map.get(id);
			feature = item?.feature;
		}
		if (feature) {
			this.addHighlighted(id);
		}

		if (!view) return feature || null;

		const geom = feature?.getGeometry();
		const coords = geom?.getCoordinates();
		if (!coords) return null;

		view.animate({
			center: coords,
			duration: 200,
			zoom: 10,
		});

		return feature || null;
	}

	public setSettings({ size, show }: { size?: number; show?: boolean }): void {
		if (size) {
			this.styleVars.size = size;
			this.mainLayer?.setStyle(getPilotStyle(this.styleVars));
			this.shadowLayer?.setStyle(getShadowStyle(this.styleVars));
		}
		if (show !== undefined) {
			this.mainLayer?.setVisible(show);
			this.shadowLayer?.setVisible(show);
		}
	}

	public focusFeatures(ids: string[]): void {
		this.unfocusFeatures();

		ids.forEach((id) => {
			const feature = this.map.get(id);
			if (feature?.feature) {
				feature.feature.set("clicked", true);
				this.focused.add(id);
			}
		});

		this.isFocused = true;
	}

	public unfocusFeatures() {
		this.focused.forEach((id) => {
			const feature = this.map.get(id);
			const highlighted = this.highlighted.has(id);
			if (feature?.feature) {
				feature.feature.set("clicked", highlighted);
			}
		});
		this.focused.clear();

		this.isFocused = false;
	}

	public getExtent(ids: string[]): Extent | null {
		const features: Feature<Point>[] = [];
		ids.forEach((id) => {
			const feature = this.map.get(id);
			if (feature?.feature) {
				features.push(feature.feature);
			}
		});

		if (features.length === 0) return null;

		const extent = features[0].getGeometry()?.getExtent();
		if (!extent) return null;

		features.forEach((feature) => {
			const geom = feature.getGeometry();
			if (geom) {
				const featExtent = geom.getExtent();
				extent[0] = Math.min(extent[0], featExtent[0]);
				extent[1] = Math.min(extent[1], featExtent[1]);
				extent[2] = Math.max(extent[2], featExtent[2]);
				extent[3] = Math.max(extent[3], featExtent[3]);
			}
		});

		return extent;
	}

	public getStats(): { total: number; rendered: number } {
		return {
			total: this.map.size,
			rendered: this.source.getFeatures().length,
		};
	}
}
