import { MapLibreLayer } from "@geoblocks/ol-maplibre-layer";
import type { StaticAirport } from "@sr24/types/db";
import type {
	AirportDelta,
	AirportShort,
	ControllerDelta,
	ControllerMerged,
	PilotDelta,
	PilotParsedRoute,
	PilotShort,
	TrackPoint,
} from "@sr24/types/interface";
import type { StyleSpecification } from "maplibre-gl";
import { type Feature, type MapBrowserEvent, Map as OlMap, type Overlay, View } from "ol";
import { click } from "ol/events/condition";
import type BaseEvent from "ol/events/Event";
import type { Extent } from "ol/extent";
import type { Point } from "ol/geom";
import Select, { type SelectEvent } from "ol/interaction/Select";
import type Layer from "ol/layer/Layer";
import { fromLonLat, toLonLat, transformExtent } from "ol/proj";
import type { FilterValues, SettingValues } from "@/types/zustand";
import { AirportService } from "./AirportService";
import { ControllerService } from "./ControllerService";
import { NavigraphService } from "./NavigraphService";
import { createOverlay, updateOverlay } from "./overlays";
import { PilotService } from "./PilotService";
import styleDark from "./positron_dark.json";
import styleLight from "./positron_light.json";
import { Sunservice } from "./SunService";
import { TrackService } from "./TrackService";
import { VatglassesService } from "./VatglassesService";

type Options = {
	onNavigate?: (href: string) => void;
	autoTrackPoints?: boolean;
	disableInteractions?: boolean;
	disableCenterOnPageLoad?: boolean;
	sunTime?: Date;
};

export class MapService {
	private static readonly MAP_PADDING = [204, 116, 140, 436];
	private static readonly HIT_TOLERANCE = 5;
	private static readonly LAYER_FILTER = (layer: Layer | undefined) => {
		const type = layer?.get("type");
		return type === "airport_main" || type === "pilot_main" || type === "sector_label";
	};
	private options: Options | null = null;

	private map: OlMap | null = null;
	private baseLayer: MapLibreLayer | null = null;

	private sunService = new Sunservice();
	private pilotService = new PilotService();
	private airportService = new AirportService();
	private controllerService = new ControllerService(() => this.sharedControllers);
	private trackService = new TrackService();
	private navigraphService = new NavigraphService();
	private vatglassesService = new VatglassesService(() => this.sharedControllers);

	private multiView: boolean | undefined;
	private minimalOverlays = false;
	private multiPath = new Set<string>();
	private hovering = false;
	private hoverFeature: Feature<Point> | null = null;
	private hoverOverlay: Overlay | null = null;
	private clickFeatures = new Map<string, Feature<Point>>();
	private clickOverlays = new Map<string, Overlay>();
	private clickSelect: Select | undefined;

	private lastExtent: Extent | null = null;
	private lastSettings: Partial<SettingValues> = {};

	private storedControllers = new Map<string, ControllerMerged>();
	private storedAirports = new Map<string, AirportShort>();
	private sharedControllers: ControllerMerged[] = [];

	private animationTimestamp = 0;
	private animationFrame?: number;

	private followInterval: NodeJS.Timeout | null = null;

	public init(options?: Options): OlMap {
		if (options) {
			this.options = options;
		}

		const savedView = localStorage.getItem("simradar21-map-view");
		const initialCenter = [0, 0];
		const initialZoom = 2;

		let center = initialCenter;
		let zoom = initialZoom;
		let rotation = 0;

		if (savedView) {
			try {
				const parsed = JSON.parse(savedView) as {
					center: [number, number];
					zoom: number;
					rotation: number;
				};
				center = parsed.center;
				zoom = parsed.zoom;
				rotation = parsed.rotation;
			} catch {
				// fallback to default
			}
		}

		this.baseLayer = new MapLibreLayer({
			mapLibreOptions: {
				style: styleLight as StyleSpecification,
			},
			properties: { type: "base" },
		});

		const sunLayer = this.sunService.init(this.options?.sunTime);
		const pilotLayers = this.pilotService.init();
		const airportLayer = this.airportService.init();
		const controllerLayers = this.controllerService.init();
		const trackLayer = this.trackService.init();
		const navigraphLayers = this.navigraphService.init();
		const vatglassesLayer = this.vatglassesService.init();

		this.map = new OlMap({
			target: "map",
			layers: [this.baseLayer, sunLayer, ...pilotLayers, airportLayer, ...controllerLayers, trackLayer, ...navigraphLayers, vatglassesLayer],
			view: new View({
				center: fromLonLat(center),
				zoom,
				maxZoom: 18,
				minZoom: 3,
				rotation,
				extent: transformExtent([-250, -80, 250, 80], "EPSG:4326", "EPSG:3857"),
			}),
			controls: [],
		});

		return this.map;
	}

	public setTheme(theme: string | undefined): void {
		const isDark = theme === "dark";
		const style = isDark ? (styleDark as StyleSpecification) : (styleLight as StyleSpecification);
		this.baseLayer?.mapLibreMap?.setStyle(style);

		this.sunService.setTheme(isDark);
		this.pilotService.setTheme(isDark);
		this.controllerService.setTheme(isDark);
		this.navigraphService.setTheme(isDark);
	}

	public setSettings(settings: Partial<SettingValues>): void {
		this.sunService.setSettings({ show: settings.dayNightLayer, brightness: settings.dayNightLayerBrightness });
		this.pilotService.setSettings({ show: settings.planeMarkers, size: settings.planeMarkerSize });
		this.airportService.setSettings({ show: settings.airportMarkers, size: settings.airportMarkerSize });
		this.controllerService.setSettings({
			showSectors: settings.sectorAreas,
			firColor: settings.firColor,
			traconColor: settings.traconColor,
			showAirports: settings.airportMarkers,
			airportSize: settings.airportMarkerSize,
		});
		this.navigraphService.setSettings({
			showData: settings.navigraphData,
			showGates: settings.navigraphGates,
			showRoutes: settings.navigraphRoutes,
			showInMulti: settings.navigraphRoutesInMulti,
		});
		this.toggleAnimation(settings.animatedPlaneMarkers || false);

		this.lastSettings = settings;
	}

	public setFilters(filters: FilterValues) {
		this.pilotService.setFilters(filters);
		this.renderFeatures();
	}

	public setView({
		rotation,
		zoomStep,
		center,
		zoom,
		multi,
		minimalOverlays,
		vatglasses,
		vatglassesAltitude,
	}: {
		rotation?: number;
		zoomStep?: number;
		center?: [number, number];
		zoom?: number;
		multi?: boolean;
		minimalOverlays?: boolean;
		vatglasses?: boolean;
		vatglassesAltitude?: number;
	}): void {
		const view = this.map?.getView();
		if (!view) return;

		const currentZoom = zoom || view.getZoom() || 2;

		if (rotation !== undefined) {
			view.setRotation(rotation);
		}
		if (zoomStep !== undefined) {
			const newZoom = currentZoom + zoomStep;
			view.animate({
				zoom: newZoom,
				duration: 300,
			});
		}
		if (center !== undefined) {
			view.setCenter(fromLonLat(center));
		}
		if (zoom !== undefined) {
			view.setZoom(zoom);
		}
		if (multi !== undefined) {
			this.setMultiView(multi);
		}
		if (minimalOverlays !== undefined) {
			this.minimalOverlays = minimalOverlays;
			this.updateRelatives();
		}
		if (vatglasses !== undefined) {
			this.vatglassesService.setVatglassesEnabled(vatglasses);
			this.controllerService.setVatglassesEnabled(vatglasses);
		}
		if (vatglassesAltitude !== undefined) {
			this.vatglassesService.setAltitude(vatglassesAltitude);
		}
	}

	private setMultiView(enabled: boolean): void {
		if (this.multiView === undefined) {
			this.multiView = enabled;
			this.minimalOverlays = enabled;
			this.navigraphService.setSettings({ multiView: enabled });
			return;
		}

		if (this.multiView !== enabled) {
			this.resetMap(false);
		}
		this.multiView = enabled;
		this.minimalOverlays = enabled;
		this.navigraphService.setSettings({ multiView: enabled });
	}

	public addEventListeners() {
		if (typeof window === "undefined") return;

		this.map?.on("moveend", this.onMoveEnd);

		this.map?.on("pointermove", this.onPointerMove);

		this.clickSelect = new Select({
			condition: click,
			toggleCondition: () => this.multiView === true,
			hitTolerance: MapService.HIT_TOLERANCE,
			layers: MapService.LAYER_FILTER,
			style: null,
		});
		this.map?.addInteraction(this.clickSelect);
		this.clickSelect.on("select", this.onClickSelect);
		this.map?.on("singleclick", this.onMapClick);
	}

	public removeEventListeners() {
		this.map?.un("moveend", this.onMoveEnd);
		this.map?.un("pointermove", this.onPointerMove);

		if (this.clickSelect) {
			this.clickSelect.un("select", this.onClickSelect);
			this.map?.removeInteraction(this.clickSelect);
			this.clickSelect = undefined;

			this.map?.un("singleclick", this.onMapClick);
		}
	}

	private onMoveEnd = (e: BaseEvent | Event) => {
		const view: View = e.target.getView();
		const center = toLonLat(view.getCenter() || [0, 0]);
		const zoom = view.getZoom() || 2;
		const rotation = view.getRotation() || 0;

		this.renderFeatures();
		localStorage.setItem("simradar21-map-view", JSON.stringify({ center, zoom, rotation }));
	};

	private onPointerMove = async (e: MapBrowserEvent) => {
		if ((e.originalEvent as PointerEvent).pointerType === "touch") return;
		if (this.hovering) return;
		this.hovering = true;

		const map = e.map;
		const feature =
			map.forEachFeatureAtPixel(e.pixel, (f) => f as Feature<Point>, {
				hitTolerance: MapService.HIT_TOLERANCE,
				layerFilter: MapService.LAYER_FILTER,
			}) ?? null;

		map.getTargetElement().style.cursor = feature ? "pointer" : "";

		if (feature === this.hoverFeature) {
			this.hovering = false;
			return;
		}

		this.clearHover();

		if (!feature) {
			this.hovering = false;
			return;
		}

		const id = feature.getId()?.toString() || null;
		if (!id || this.clickFeatures.has(id)) {
			this.hovering = false;
			return;
		}

		feature.set("hovered", true);
		this.controllerService.hoverSector(feature, true, "hovered");

		const overlay = await createOverlay(
			feature,
			this.getCachedAirport(feature),
			this.getCachedController(feature),
			this.minimalOverlays || this.multiView,
		);

		if (this.hoverFeature !== null) {
			this.hovering = false;
			return;
		}

		this.hoverFeature = feature;
		this.hoverOverlay = overlay;
		map.addOverlay(overlay);

		this.hovering = false;
	};

	private clearHover = () => {
		if (!this.map) return;

		if (this.hoverOverlay) {
			const root = this.hoverOverlay.get("root");
			this.hoverOverlay.unset("root");
			root?.unmount();
			this.map.removeOverlay(this.hoverOverlay);
			this.hoverOverlay = null;
		}

		if (this.hoverFeature) {
			this.hoverFeature.set("hovered", false);
			this.controllerService.hoverSector(this.hoverFeature, false, "hovered");
			this.hoverFeature = null;
		}
	};

	private onClickSelect = async (e: SelectEvent) => {
		const isManual = !!e.mapBrowserEvent;
		if (isManual && this.options?.disableInteractions) return;

		const selected = (this.multiView ? e.selected : [e.selected[0]]) as (Feature<Point> | undefined)[];
		const deselected = (this.multiView ? e.deselected : [e.deselected[0]]) as (Feature<Point> | undefined)[];

		for (const f of deselected) {
			this.manualDeselectFeature(f, isManual);
		}

		for (const f of selected) {
			await this.manualSelectFeature(f, isManual);
		}

		if (selected.length > 0 && isManual) {
			this.unfocusFeatures();
		}
	};

	private async manualSelectFeature(feature: Feature<Point> | undefined, isManual: boolean = false): Promise<void> {
		const id = feature?.getId()?.toString() || null;
		if (!id || !feature) return;

		const overlay = await createOverlay(
			feature,
			this.getCachedAirport(feature),
			this.getCachedController(feature),
			this.minimalOverlays || this.multiView,
		);
		this.map?.addOverlay(overlay);
		this.clickOverlays.set(id, overlay);

		feature.set("clicked", true);
		this.clickFeatures.set(id, feature);

		this.controllerService.hoverSector(feature, true, "clicked");

		const type = feature.get("type") as string | undefined;

		if (type === "pilot" && id) {
			const strippedId = id.toString().replace(/^pilot_/, "");
			this.navigate(strippedId, "pilot", isManual, "add");
			this.pilotService.addHighlighted(strippedId);
		}

		if (type === "airport" && id) {
			const strippedId = id.toString().replace(/^airport_/, "");
			this.navigate(strippedId, "airport", isManual, "add");
			this.airportService.addHighlighted(strippedId);
		}

		if ((type === "tracon" || type === "fir") && id) {
			const strippedId = id.toString().replace(/^(sector)_/, "");
			this.navigate(strippedId, "sector", isManual, "add");
			this.controllerService.addHighlighted(`${type}_${strippedId}`);
		}
	}

	private manualDeselectFeature(feature: Feature<Point> | undefined, isManual: boolean = false): void {
		const id = feature?.getId()?.toString() || null;
		if (!id || !feature) return;

		const overlay = this.clickOverlays.get(id);
		if (overlay) {
			const root = overlay.get("root");
			overlay.unset("root");
			root?.unmount();
			this.map?.removeOverlay(overlay);
			this.clickOverlays.delete(id);
		}

		this.controllerService.hoverSector(feature, false, "clicked");

		feature.set("clicked", false);
		this.clickFeatures.delete(id);

		const type = feature.get("type") as string | undefined;

		if (type === "pilot" && id) {
			const strippedId = id.toString().replace(/^pilot_/, "");
			this.navigate(strippedId, "pilot", isManual, "delete");
			this.pilotService.removeHighlighted(strippedId);
			this.trackService.removeFeatures(strippedId);
			this.navigraphService.removeRouteFeatures(strippedId);
		}

		if (type === "airport" && id) {
			const strippedId = id.toString().replace(/^airport_/, "");
			this.navigate(strippedId, "airport", isManual, "delete");
			this.airportService.removeHighlighted(strippedId);
		}

		if ((type === "tracon" || type === "fir") && id) {
			const strippedId = id.toString().replace(/^(sector)_/, "");
			this.navigate(strippedId, "sector", isManual, "delete");
			this.controllerService.removeHighlighted(strippedId);
		}
	}

	private onMapClick = (e: MapBrowserEvent) => {
		if (this.options?.disableInteractions) return;

		const map = e.map;
		const hit = map.hasFeatureAtPixel(e.pixel, {
			hitTolerance: MapService.HIT_TOLERANCE,
			layerFilter: MapService.LAYER_FILTER,
		});

		if (!hit && !this.multiView) {
			this.resetMap();
		}
	};

	private navigate(id: string, type: string, isManual: boolean, mode: "add" | "delete"): void {
		if (!this.multiView && isManual) {
			this.options?.onNavigate?.(mode === "add" ? `/${type}/${id}` : `/`);
			return;
		}

		this.multiPath[mode](`${type}_${id}`);

		if (!isManual) return;

		if (this.multiPath.size > 0) {
			const path = Array.from(this.multiPath).join("%2C");
			this.options?.onNavigate?.(`/multi/?selected=${path}`);
		} else {
			this.options?.onNavigate?.(`/multi`);
		}
	}

	public clearMap(): void {
		this.trackService.clearFeatures();
		this.navigraphService.clearFeatures();
	}

	public resetMap(nav: boolean = true): void {
		this.clearMap();

		for (const feature of this.clickFeatures.values()) {
			this.controllerService.hoverSector(feature, false, "clicked");
		}
		this.pilotService.clearHighlighted();
		this.airportService.clearHighlighted();
		this.controllerService.clearHighlighted();

		this.unfollowPilot();

		if (this.lastExtent) {
			this.map?.getView().fit(this.lastExtent, {
				duration: 200,
			});
			this.lastExtent = null;
		}

		for (const feature of this.clickFeatures.values()) {
			this.manualDeselectFeature(feature);
		}

		if (nav) {
			this.options?.onNavigate?.(this.multiView ? `/multi` : `/`);
			this.multiPath.clear();
		}

		this.renderFeatures();
	}

	public async setFeatures({
		pilots,
		airports,
		controllers,
		trackPoints,
		autoTrackId,
		sunTime,
		route,
	}: {
		pilots?: Required<PilotShort>[];
		airports?: StaticAirport[];
		controllers?: ControllerMerged[];
		trackPoints?: TrackPoint[];
		autoTrackId?: string;
		sunTime?: Date;
		route?: PilotParsedRoute;
	}): Promise<void> {
		if (pilots) {
			this.pilotService.setFeatures(pilots);
		}
		if (airports) {
			this.airportService.setFeatures(airports);
		}
		if (controllers) {
			this.sharedControllers = controllers;
			this.vatglassesService.setFeatures(controllers);
			await this.controllerService.setFeatures(controllers);
		}
		if (trackPoints && autoTrackId) {
			this.trackService.setFeatures(trackPoints, autoTrackId);
		}
		if (sunTime) {
			this.sunService.setFeatures(sunTime);
		}
		if (route && autoTrackId) {
			this.navigraphService.setRouteFeatures(route, autoTrackId);
		}

		await new Promise(requestAnimationFrame);

		this.renderFeatures();
	}

	public async revalidateFeatures({
		pilots,
		airports,
		controllers,
	}: {
		pilots?: Required<PilotShort>[];
		airports?: StaticAirport[];
		controllers?: ControllerMerged[];
	}): Promise<void> {
		if (pilots) {
			this.pilotService.setFeatures(pilots);
		}
		if (airports) {
			// this.airportService.setFeatures(airports);
		}
		if (controllers) {
			this.sharedControllers = controllers;
			this.vatglassesService.setFeatures(controllers);
			await this.controllerService.setFeatures(controllers);
		}

		this.updateRelatives();
		this.renderFeatures();
	}

	public async updateFeatures({
		pilots,
		airports,
		controllers,
		sunTime,
	}: {
		pilots?: PilotDelta;
		airports?: StaticAirport[];
		controllers?: ControllerDelta;
		sunTime?: Date;
	}): Promise<void> {
		const removedIds: string[] = [];

		if (pilots) {
			removedIds.push(...this.pilotService.updateFeatures(pilots));
		}
		if (airports) {
			// resetNeeded = this.airportService.updateFeatures(airports) || resetNeeded;
		}
		if (controllers) {
			removedIds.push(...(await this.controllerService.updateFeatures(controllers)));
		}
		if (sunTime) {
			this.sunService.setFeatures(sunTime);
		}

		this.updateRelatives();

		for (const id of removedIds) {
			const clickFeature = this.clickFeatures.get(id);
			if (clickFeature) {
				this.manualDeselectFeature(clickFeature);
				this.multiPath.delete(id);
			}
		}

		if (removedIds.length > 0) {
			if (this.multiView) {
				const path = Array.from(this.multiPath).join("%2C");
				this.options?.onNavigate?.(this.multiPath.size > 0 ? `/multi/?selected=${path}` : `/multi`);
			} else {
				this.options?.onNavigate?.(`/`);
				this.multiPath.clear();
			}
		}

		this.renderFeatures();
	}

	private updateRelatives(): void {
		for (const feature of this.clickFeatures.values()) {
			const id = feature.getId()?.toString() || null;
			if (!id) continue;

			const overlay = this.clickOverlays.get(id);
			if (!overlay) continue;

			updateOverlay(feature, overlay, this.getCachedAirport(feature), this.getCachedController(feature), this.minimalOverlays || this.multiView);
		}

		if (this.hoverFeature && this.hoverOverlay) {
			updateOverlay(
				this.hoverFeature,
				this.hoverOverlay,
				this.getCachedAirport(this.hoverFeature),
				this.getCachedController(this.hoverFeature),
				this.minimalOverlays || this.multiView,
			);
		}

		if (this.options?.autoTrackPoints) {
			for (const feature of this.clickFeatures.values()) {
				const type = feature.get("type") as string | undefined;
				const id = feature.getId()?.toString() || null;
				if (type !== "pilot" || !id) continue;

				this.trackService.updateFeatures(feature, id.replace(/^pilot_/, ""));
			}
		}
	}

	public setStore({ airports, controllers }: { airports?: AirportShort[]; controllers?: ControllerMerged[] }): void {
		if (airports) {
			for (const airport of airports) {
				this.storedAirports.set(airport.icao, airport);
				if (airport.blocked_gates) {
					this.navigraphService.setBlockedGates(airport.icao, airport.blocked_gates);
				}
			}
		}
		if (controllers) {
			for (const controller of controllers) {
				this.storedControllers.set(controller.id, controller);
			}
		}
	}

	public updateStore({ airports, controllers }: { airports?: AirportDelta; controllers?: ControllerDelta }): void {
		if (airports) {
			const nextAirports = new Map<string, AirportShort>();

			for (const airport of airports.added) {
				nextAirports.set(airport.icao, airport);
				this.navigraphService.setBlockedGates(airport.icao, airport.blocked_gates ?? []);
			}

			for (const a of airports.updated) {
				const existing = this.storedAirports.get(a.icao);

				nextAirports.set(a.icao, {
					...existing,
					...a,
				});
				if (a.blocked_gates !== undefined) {
					this.navigraphService.setBlockedGates(a.icao, a.blocked_gates);
				}
			}
			this.storedAirports = nextAirports;
		}
		if (controllers) {
			const nextControllers = new Map<string, ControllerMerged>();

			for (const controller of controllers.added) {
				nextControllers.set(controller.id, controller);
			}

			for (const c of controllers.updated) {
				const existing = this.storedControllers.get(c.id);
				const controllers = c.controllers.map((ctl) => {
					const existingCtl = existing?.controllers.find((e) => e.callsign === ctl.callsign);
					return { ...existingCtl, ...ctl };
				});

				nextControllers.set(c.id, {
					...existing,
					...c,
					controllers,
				});
			}
			this.storedControllers = nextControllers;
		}
	}

	private renderFeatures() {
		const view = this.map?.getView();
		if (!view) return;

		const extent = view.calculateExtent();
		const resolution = view.getResolution() || 0;

		this.pilotService.renderFeatures(extent, resolution);
		this.airportService.renderFeatures(extent, resolution);
		this.navigraphService.renderFeatures(extent, resolution);
	}

	private toggleAnimation(enabled: boolean): void {
		if (!enabled) {
			if (this.animationFrame) {
				cancelAnimationFrame(this.animationFrame);
				this.animationFrame = undefined;
			}
			return;
		}

		this.animationTimestamp = performance.now();

		const tick = (now: number) => {
			const elapsed = now - this.animationTimestamp;

			const resolution = this.map?.getView().getResolution() ?? 0;
			const target = Math.min(Math.max(resolution * 5, 200), 2000);

			if (elapsed >= target) {
				this.animateTick(elapsed);
				this.animationTimestamp = now;
			}

			this.animationFrame = requestAnimationFrame(tick);
		};
		this.animationFrame = requestAnimationFrame(tick);
	}

	private animateTick(elapsed: number): void {
		this.pilotService.animateFeatures(elapsed);

		for (const feature of this.clickFeatures.values()) {
			const id = feature.getId()?.toString() || null;
			const type = feature.get("type") as string | undefined;
			if (type !== "pilot" || !id) continue;

			const overlay = this.clickOverlays.get(id);
			if (overlay) {
				this.clickOverlays.set(id, overlay);
				updateOverlay(feature, overlay, this.getCachedAirport(feature), this.getCachedController(feature), this.minimalOverlays || this.multiView);
			}

			this.trackService.animateFeatures(id, feature);
		}

		if (this.hoverOverlay && this.hoverFeature?.getGeometry()) {
			this.hoverOverlay.setPosition(this.hoverFeature.getGeometry()?.getCoordinates());
		}
	}

	public addClickFeature(type?: string, id?: string, init?: boolean): void {
		if (!id || !type) return;

		const isAlreadyClicked = this.clickFeatures?.has(`${type}_${id}`);
		const view = this.options?.disableCenterOnPageLoad || this.multiView === true || (!init && isAlreadyClicked) ? undefined : this.map?.getView();
		let clickFeature: Feature<Point> | null = null;

		if (type === "pilot") {
			clickFeature = this.pilotService.moveToFeature(id, view);
		}
		if (type === "airport") {
			clickFeature = this.airportService.moveToFeature(id, view);
		}
		if (type === "sector") {
			clickFeature = this.controllerService.moveToFeature(id, view);
		}

		if (!clickFeature || isAlreadyClicked) return;

		const isSelected = this.clickSelect?.selectFeature(clickFeature);
		if (isSelected) return;

		this.manualSelectFeature(clickFeature);
	}

	public removeClickFeature(type?: string, id?: string): void {
		if (!id || !type) return;

		const clickFeature = this.clickFeatures?.get(`${type}_${id}`);
		if (!clickFeature) return;

		const isDeselected = this.clickSelect?.deselectFeature(clickFeature);
		if (isDeselected) return;

		this.manualDeselectFeature(clickFeature);
	}

	public async addHoverFeature(type?: string, id?: string): Promise<void> {
		if (!id || !type) return;

		if (type === "pilot") {
			this.hoverFeature = this.pilotService.moveToFeature(id);
		}
		if (type === "airport") {
			this.hoverFeature = this.airportService.moveToFeature(id);
		}
		if (type === "sector") {
			this.hoverFeature = this.controllerService.moveToFeature(id);
		}

		if (this.hoverFeature) {
			this.hoverFeature.set("hovered", true);
			this.controllerService.hoverSector(this.hoverFeature, true, "hovered");

			this.hoverOverlay = await createOverlay(
				this.hoverFeature,
				this.getCachedAirport(this.hoverFeature),
				this.getCachedController(this.hoverFeature),
				this.minimalOverlays || this.multiView,
			);
			this.map?.addOverlay(this.hoverOverlay);
		}
	}

	public removeHoverFeature(): void {
		this.hoverFeature?.set("hovered", false);
		this.controllerService.hoverSector(this.hoverFeature, false, "hovered");
		this.hoverFeature = null;

		if (this.hoverOverlay) {
			const root = this.hoverOverlay.get("root");
			this.hoverOverlay.unset("root");
			root?.unmount();
			this.map?.removeOverlay(this.hoverOverlay);
			this.hoverOverlay = null;
		}
	}

	private getCachedAirport(feature: Feature<Point>): AirportShort | undefined {
		const id = feature
			.getId()
			?.toString()
			.replace(/^airport_/, "");
		return this.storedAirports.get(id || "");
	}

	private getCachedController(feature: Feature<Point>): ControllerMerged | undefined {
		const id = feature
			.getId()
			?.toString()
			.replace(/^(sector|airport)_/, "");
		const type = feature.get("type");
		return this.storedControllers.get(`${type}_${id}`);
	}

	private toggleLayerVisibility(layerTypes: ("airport" | "pilot" | "controller" | "track")[], visible: boolean): void {
		layerTypes.forEach((type) => {
			switch (type) {
				case "airport":
					this.airportService.setSettings({ show: visible ? this.lastSettings?.airportMarkers : false });
					break;
				case "pilot":
					this.pilotService.setSettings({ show: visible });
					break;
				case "controller":
					this.controllerService.setSettings({
						showSectors: visible ? this.lastSettings?.sectorAreas : false,
						showAirports: visible ? this.lastSettings?.airportMarkers : false,
					});
					break;
				case "track":
					this.trackService.setSettings({ show: visible });
					break;
			}
		});
	}

	public focusFeatures({
		pilots,
		airports,
		hideLayers,
	}: {
		pilots?: string[];
		airports?: string[];
		hideLayers?: ("airport" | "pilot" | "controller" | "track")[];
	}): void {
		if (pilots && pilots.length > 0) {
			this.pilotService.focusFeatures(pilots);
		}
		if (airports && airports.length > 0) {
			this.airportService.focusFeatures(airports);
		}

		if (hideLayers) {
			this.toggleLayerVisibility(hideLayers, false);
		}

		this.renderFeatures();
	}

	public unfocusFeatures(): void {
		this.pilotService.unfocusFeatures();
		this.airportService.unfocusFeatures();
		this.toggleLayerVisibility(["airport", "pilot", "controller", "track"], true);

		this.renderFeatures();
	}

	public fitFeatures({ pilots, airports, rememberView = true }: { pilots?: string[]; airports?: string[]; rememberView?: boolean } = {}): void {
		const view = this.map?.getView();
		if (!view) return;

		if (pilots && pilots.length > 0) {
			const extent = this.pilotService.getExtent(pilots);
			if (extent) {
				if (rememberView) {
					this.lastExtent = view.calculateExtent();
				}
				view.fit(extent, {
					padding: MapService.MAP_PADDING,
					duration: 200,
					maxZoom: 14,
				});
			}

			return;
		}

		if (airports && airports.length > 0) {
			const extent = this.airportService.getExtent(airports);
			if (extent) {
				if (rememberView) {
					this.lastExtent = view.calculateExtent();
				}
				view.fit(extent, {
					padding: MapService.MAP_PADDING,
					duration: 200,
					maxZoom: 14,
				});
			}

			return;
		}

		if (this.lastExtent) {
			view.fit(this.lastExtent, {
				duration: 200,
			});
			this.lastExtent = null;
		}
	}

	public followPilot({ rememberView = true }: { rememberView?: boolean } = {}): void {
		this.unfollowPilot();

		const view = this.map?.getView();
		if (!view) return;

		if (this.lastExtent) {
			view.fit(this.lastExtent, {
				duration: 200,
			});
			this.lastExtent = null;
		}

		const clickFeature = this.clickFeatures.values().next().value as Feature<Point> | undefined;
		const type = clickFeature?.get("type") as string | undefined;
		if (type !== "pilot" || !clickFeature) return;

		const follow = () => {
			const geom = clickFeature.getGeometry();
			const coords = geom?.getCoordinates();
			if (coords) {
				view.animate({
					center: coords,
					duration: 200,
				});
			}
		};

		if (rememberView) {
			this.lastExtent = view.calculateExtent();
		}

		follow();
		this.followInterval = setInterval(follow, 3000);
	}

	public unfollowPilot(): void {
		if (this.followInterval) {
			clearInterval(this.followInterval);
			this.followInterval = null;
		}
	}
}
