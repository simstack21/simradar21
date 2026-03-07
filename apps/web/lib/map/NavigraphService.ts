import type { PilotParsedRoute, PilotRouteProcedure } from "@sr24/types/interface";
import { Feature } from "ol";
import type { Extent } from "ol/extent";
import { LineString, Point } from "ol/geom";
import VectorLayer from "ol/layer/Vector";
import { fromLonLat, transformExtent } from "ol/proj";
import VectorSource from "ol/source/Vector";
import RBush from "rbush";
import { dxGetAllAirports, dxGetNavigraphAirports, dxGetNavigraphWaypoints } from "@/storage/dexie";
import { getApproachPoints, getLonLatPoint, getSidPoints, getStarPoints } from "./navigraph";
import { getNavigraphGateStyle, getNavigraphRoutePointStyle, getNavigraphRouteTrackStyle, type NavigraphStyleVars } from "./styles/navigraph";

type RBushAirport = {
	minX: number;
	minY: number;
	maxX: number;
	maxY: number;
	id: string;
};

export class NavigraphService {
	private gateSource = new VectorSource<Feature<Point>>({
		useSpatialIndex: false,
	});
	private gateLayer: VectorLayer | null = null;
	private routePointSource = new VectorSource<Feature<Point>>({
		useSpatialIndex: false,
	});
	private routePointLayer: VectorLayer | null = null;
	private routeTrackSource = new VectorSource<Feature<LineString>>({
		useSpatialIndex: false,
	});
	private routeTrackLayer: VectorLayer | null = null;

	private rbush = new RBush<RBushAirport>();
	private cachedAirports = new Set<string>();
	private cachedRoutes = new Set<string>();
	private cachedProcedureKeys = new Map<string, { sid: string; star: string; approach: string }>();

	private styleVars: NavigraphStyleVars = {};
	private blockedGatesAirport = new Map<string, Set<string>>();

	public init(): VectorLayer[] {
		this.initRBush();

		this.gateLayer = new VectorLayer({
			source: this.gateSource,
			style: getNavigraphGateStyle(this.styleVars),
			properties: {
				type: "navigraph_gate",
			},
			declutter: "separate",
			zIndex: 3,
		});
		this.routePointLayer = new VectorLayer({
			source: this.routePointSource,
			style: getNavigraphRoutePointStyle(this.styleVars),
			properties: {
				type: "navigraph_route_point",
			},
			zIndex: 4,
		});
		this.routeTrackLayer = new VectorLayer({
			source: this.routeTrackSource,
			style: getNavigraphRouteTrackStyle(this.styleVars),
			properties: {
				type: "navigraph_route_track",
			},
			zIndex: 4,
		});

		return [this.gateLayer, this.routePointLayer, this.routeTrackLayer];
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
		this.gateLayer?.setStyle(getNavigraphGateStyle(this.styleVars));
		this.routePointLayer?.setStyle(getNavigraphRoutePointStyle(this.styleVars));
		this.routeTrackLayer?.setStyle(getNavigraphRouteTrackStyle(this.styleVars));
	}

	public setBlockedGates(icao: string, blockedGates: string[]): void {
		this.blockedGatesAirport.set(icao, new Set(blockedGates));

		if (!this.cachedAirports.has(icao)) return;

		const prefix = `navigraph_gate_${icao}_`;
		const blocked = this.blockedGatesAirport.get(icao) ?? new Set<string>();
		for (const feature of this.gateSource.getFeatures()) {
			const id = feature.getId()?.toString();
			if (!id?.startsWith(prefix)) continue;
			feature.set("blocked", blocked.has(id.slice(prefix.length)));
		}
	}

	public renderFeatures(extent: Extent, resolution: number) {
		this.renderGates(extent, resolution);
	}

	private async renderGates(extent: Extent, resolution: number) {
		if (resolution > 10) {
			this.gateSource.clear();
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

			const blocked = this.blockedGatesAirport.get(a.id) ?? new Set<string>();
			a.gates.forEach((gate) => {
				const feature = new Feature({
					geometry: new Point(fromLonLat([gate.longitude, gate.latitude])),
					label: gate.id,
					blocked: blocked.has(gate.id),
				});
				feature.setId(`navigraph_gate_${a.id}_${gate.id}`);
				features.push(feature);
			});
		});
		this.gateSource.addFeatures(features);
	}

	public async setRouteFeatures(route: PilotParsedRoute, id: string): Promise<void> {
		const procKeys = this.cachedProcedureKeys.get(id);

		if (!this.cachedRoutes.has(id)) {
			const pointFeatures: Feature<Point>[] = [];
			const waypoints = await dxGetNavigraphWaypoints(route.waypoints.map((wp) => wp.uid));

			for (const [i, point] of route.waypoints.entries()) {
				let wp = waypoints.find((w) => w?.uid === point.uid);
				if (!wp) {
					wp = getLonLatPoint(point.uid);
				}
				if (!wp) continue;

				const feature = new Feature({
					geometry: new Point(fromLonLat([wp.longitude, wp.latitude])),
					label: wp.id,
					class: wp.class,
				});
				feature.setId(`navigraph_route_point_${id}_${i}`);
				pointFeatures.push(feature);
			}
			this.routePointSource.addFeatures(pointFeatures);

			const trackFeatures: Feature<LineString>[] = [];
			for (let i = 0; i < route.waypoints.length - 1; i++) {
				let start = waypoints.find((w) => w?.uid === route.waypoints[i].uid);
				if (!start) {
					start = getLonLatPoint(route.waypoints[i].uid);
				}
				let end = waypoints.find((w) => w?.uid === route.waypoints[i + 1].uid);
				if (!end) {
					end = getLonLatPoint(route.waypoints[i + 1].uid);
				}
				if (!start || !end) continue;

				const trackFeature = new Feature({
					geometry: new LineString([fromLonLat([start.longitude, start.latitude]), fromLonLat([end.longitude, end.latitude])]),
					type: "navigraph_route_track",
				});
				const airway = route.waypoints[i].airwayUid || route.waypoints[i + 1].airwayUid;
				const airwayParts = airway?.split(":") || [];
				if (airway) trackFeature.set("label", airwayParts[3]);

				trackFeature.setId(`navigraph_route_track_${id}_${i}`);
				trackFeatures.push(trackFeature);
			}
			this.routeTrackSource.addFeatures(trackFeatures);
		}

		const sidKey = JSON.stringify(route.sid);
		const starKey = JSON.stringify({ proc: route.star?.proc, rwy: route.star?.rwy, rwyCon: route.star?.rwyCon, trans: route.star?.trans });
		const approachKey = JSON.stringify({ approach: route.star?.approach, approachTrans: route.star?.approachTrans });

		if (!procKeys || procKeys.sid !== sidKey) {
			this.removeProcedureFeatures("sid", id);
			await this.setProcedureFeatures("sid", id, route.sid);
		}
		if (!procKeys || procKeys.star !== starKey) {
			this.removeProcedureFeatures("star", id);
			await this.setProcedureFeatures("star", id, route.star);
		}
		if (!procKeys || procKeys.approach !== approachKey) {
			this.removeProcedureFeatures("approach", id);
			await this.setProcedureFeatures("approach", id, route.star);
		}

		this.cachedProcedureKeys.set(id, { sid: sidKey, star: starKey, approach: approachKey });
		this.cachedRoutes.add(id);
	}

	private async setProcedureFeatures(type: "sid" | "star" | "approach", id: string, proc: PilotRouteProcedure | null): Promise<void> {
		if (!proc) return;

		const waypoints = type === "sid" ? await getSidPoints(proc) : type === "star" ? await getStarPoints(proc) : await getApproachPoints(proc);
		const pointFeatures: Feature<Point>[] = [];

		for (const [i, point] of waypoints.entries()) {
			if (!point) continue;

			const feature = new Feature({
				geometry: new Point(fromLonLat([point.longitude, point.latitude])),
				label: point.id,
				class: point.class,
			});
			feature.setId(`navigraph_route_point_${id}_${i}_${type}`);
			pointFeatures.push(feature);
		}
		this.routePointSource.addFeatures(pointFeatures);

		const label = proc.rwyCon?.split(":")[1] || proc.proc?.split(":")[1] || proc.trans?.split(":")[1] || type.toUpperCase();
		const trackFeatures: Feature<LineString>[] = [];
		for (let i = 0; i < waypoints.length - 1; i++) {
			const start = waypoints[i];
			const end = waypoints[i + 1];
			if (!start || !end) continue;

			const trackFeature = new Feature({
				geometry: new LineString([fromLonLat([start.longitude, start.latitude]), fromLonLat([end.longitude, end.latitude])]),
				type,
			});
			trackFeature.set("label", label);
			trackFeature.setId(`navigraph_route_track_${id}_${i}_${type}`);
			trackFeatures.push(trackFeature);
		}
		this.routeTrackSource.addFeatures(trackFeatures);
	}

	private removeProcedureFeatures(type: "sid" | "star" | "approach", id: string): void {
		const prefix = `navigraph_route_point_${id}_`;
		const suffix = `_${type}`;
		this.routePointSource
			.getFeatures()
			.filter((f) => {
				const fid = String(f.getId());
				return fid.startsWith(prefix) && fid.endsWith(suffix);
			})
			.forEach((f) => void this.routePointSource.removeFeature(f));
		const trackPrefix = `navigraph_route_track_${id}_`;
		this.routeTrackSource
			.getFeatures()
			.filter((f) => {
				const fid = String(f.getId());
				return fid.startsWith(trackPrefix) && fid.endsWith(suffix);
			})
			.forEach((f) => void this.routeTrackSource.removeFeature(f));
	}

	public removeRouteFeatures(id: string): void {
		this.routePointSource
			.getFeatures()
			.filter((f) => String(f.getId()).startsWith(`navigraph_route_point_${id}_`))
			.forEach((f) => void this.routePointSource.removeFeature(f));

		this.routeTrackSource
			.getFeatures()
			.filter((f) => String(f.getId()).startsWith(`navigraph_route_track_${id}_`))
			.forEach((f) => void this.routeTrackSource.removeFeature(f));

		this.cachedRoutes.delete(id);
		this.cachedProcedureKeys.delete(id);
	}

	public clearFeatures(): void {
		this.routePointSource.clear();
		this.routeTrackSource.clear();
		this.cachedRoutes.clear();
		this.cachedProcedureKeys.clear();
	}
}
