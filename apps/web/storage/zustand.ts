import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
	AirportPanelState,
	DashboardPanelState,
	FilterKey,
	FilterState,
	FilterValues,
	MapSettings,
	PilotPanelState,
	SectorPanelState,
	SettingState,
	SettingValues,
	UnitSettings,
} from "@/types/zustand";

const defaultMapSettings: MapSettings = {
	dayNightLayer: true,
	dayNightLayerBrightness: 50,
	airportMarkers: true,
	airportOverlay: "full",
	airportMarkerSize: 50,
	planeMarkers: true,
	planeOverlay: "full",
	planeMarkerSize: 50,
	animatedPlaneMarkers: false,
	sectorAreas: true,
	sectorOverlay: "full",
	traconColor: { r: 222, g: 89, b: 234, a: 0.1 },
	firColor: { r: 77, g: 95, b: 131, a: 0.15 },
	navigraphData: true,
	navigraphGates: true,
	navigraphRoutes: true,
	navigraphRoutesInMulti: false,
};

const defaultUnitSettings: UnitSettings = {
	theme: "dark",
	timeZone: "utc",
	timeFormat: "24h",
	temperatureUnit: "celsius",
	speedUnit: "knots",
	verticalSpeedUnit: "fpm",
	windSpeedUnit: "knots",
	altitudeUnit: "feet",
	distanceUnit: "nm",
};

const defaultSettings: SettingValues = {
	...defaultMapSettings,
	...defaultUnitSettings,
};

function getSettingValues(): SettingValues {
	const s = useSettingsStore.getState();
	return {
		theme: s.theme,
		dayNightLayer: s.dayNightLayer,
		dayNightLayerBrightness: s.dayNightLayerBrightness,
		airportMarkers: s.airportMarkers,
		airportOverlay: s.airportOverlay,
		airportMarkerSize: s.airportMarkerSize,
		planeMarkers: s.planeMarkers,
		planeOverlay: s.planeOverlay,
		planeMarkerSize: s.planeMarkerSize,
		animatedPlaneMarkers: s.animatedPlaneMarkers,
		sectorAreas: s.sectorAreas,
		sectorOverlay: s.sectorOverlay,
		traconColor: s.traconColor,
		firColor: s.firColor,
		timeZone: s.timeZone,
		timeFormat: s.timeFormat,
		temperatureUnit: s.temperatureUnit,
		speedUnit: s.speedUnit,
		verticalSpeedUnit: s.verticalSpeedUnit,
		windSpeedUnit: s.windSpeedUnit,
		altitudeUnit: s.altitudeUnit,
		distanceUnit: s.distanceUnit,
		navigraphData: s.navigraphData,
		navigraphGates: s.navigraphGates,
		navigraphRoutes: s.navigraphRoutes,
		navigraphRoutesInMulti: s.navigraphRoutesInMulti,
	};
}

export async function storeUserSettings(): Promise<void> {
	try {
		await fetch("/user", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ settings: getSettingValues() }),
		});
	} catch (err) {
		console.error("Failed to save settings:", err);
	}
}

export async function fetchUserSettings(): Promise<void> {
	try {
		const res = await fetch("/user/data", { cache: "no-store" });
		if (!res.ok) {
			return;
		}

		const data = await res.json();
		useSettingsStore.getState().setSettings(data.settings);
	} catch (err) {
		console.error("Failed to load settings:", err);
	}
}

export const useSettingsStore = create<SettingState>()(
	persist(
		(set) => ({
			...defaultSettings,

			setTheme: (value) => set({ theme: value }),
			setDayNightLayer: (value) => set({ dayNightLayer: value }),
			setDayNightLayerBrightness: (value) => set({ dayNightLayerBrightness: value }),
			setAirportMarkers: (value) => set({ airportMarkers: value }),
			setAirportOverlay: (value) => set({ airportOverlay: value }),
			setAirportMarkerSize: (value) => set({ airportMarkerSize: value }),
			setPlaneMarkers: (value) => set({ planeMarkers: value }),
			setPlaneOverlay: (value) => set({ planeOverlay: value }),
			setPlaneMarkerSize: (value) => set({ planeMarkerSize: value }),
			setAnimatedPlaneMarkers: (value) => set({ animatedPlaneMarkers: value }),
			setSectorAreas: (value) => set({ sectorAreas: value }),
			setSectorOverlay: (value) => set({ sectorOverlay: value }),
			setTraconColor: (value) => set({ traconColor: value }),
			setFirColor: (value) => set({ firColor: value }),
			setTimeZone: (value) => set({ timeZone: value }),
			setTimeFormat: (value) => set({ timeFormat: value }),
			setTemperatureUnit: (value) => set({ temperatureUnit: value }),
			setSpeedUnit: (value) => set({ speedUnit: value }),
			setVerticalSpeedUnit: (value) => set({ verticalSpeedUnit: value }),
			setWindSpeedUnit: (value) => set({ windSpeedUnit: value }),
			setAltitudeUnit: (value) => set({ altitudeUnit: value }),
			setDistanceUnit: (value) => set({ distanceUnit: value }),
			setNavigraphData: (value) => set({ navigraphData: value }),
			setNavigraphGates: (value) => set({ navigraphGates: value }),
			setNavigraphRoutes: (value) => set({ navigraphRoutes: value }),
			setNavigraphRoutesInMulti: (value) => set({ navigraphRoutesInMulti: value }),

			setSettings: (settings) => set({ ...settings }),
			resetAllSettings: () => set({ ...defaultSettings }),
			resetMapSettings: () => set({ ...defaultMapSettings }),
			resetUnitSettings: () => set({ ...defaultUnitSettings }),
		}),
		{
			name: "simradar21-user-settings",
		},
	),
);

const initialFilters: FilterValues = {
	active: false,
	airline: [],
	callsign: [],
	type: [],
	registration: [],
	departure: [],
	arrival: [],
	anyAirport: [],
	altitude: [0, 50000],
	groundspeed: [0, 1000],
	squawk: [],
	rules: [],
};

const MAX_PRESETS = 5;

export const useFiltersStore = create<FilterState>()(
	persist(
		(set) => ({
			...initialFilters,
			activeFilters: [],
			savedPresets: [],

			addFilter: (key: FilterKey) =>
				set((state) =>
					state.activeFilters.includes(key)
						? state
						: {
								activeFilters: [...state.activeFilters, key],
								active: true,
							},
				),
			removeFilter: (key: FilterKey) =>
				set((state) => {
					const nextActiveFilters = state.activeFilters.filter((f) => f !== key);

					return {
						activeFilters: nextActiveFilters,
						[key]: initialFilters[key],
						active: nextActiveFilters.length > 0,
					};
				}),
			setFilterValue: <K extends FilterKey>(key: K, value: FilterValues[K]) =>
				set(() => ({
					[key]: value,
					active: true,
				})),
			clearFilters: () =>
				set(() => ({
					...initialFilters,
					activeFilters: [],
					active: false,
				})),

			savePreset: (name: string) =>
				set((state) => {
					if (state.savedPresets.length >= MAX_PRESETS) {
						return state;
					}

					return {
						savedPresets: [
							...state.savedPresets,
							{
								id: crypto.randomUUID(),
								name,
								values: { ...state },
								createdAt: Date.now(),
							},
						],
					};
				}),

			applyPreset: (id: string) =>
				set((state) => {
					const preset = state.savedPresets.find((p) => p.id === id);
					if (!preset) return state;

					return {
						...preset.values,
					};
				}),

			deletePreset: (id: string) =>
				set((state) => ({
					savedPresets: state.savedPresets.filter((p) => p.id !== id),
				})),
		}),
		{
			name: "simradar21-user-filters",
		},
	),
);

type MapVisibilityState = {
	_hasHydrated: boolean;
	isHidden: boolean;
	setHidden: (value: boolean) => void;
	vatglasses: boolean;
	setVatglasses: (value: boolean) => void;
	vatglassesAltitude: number;
	setVatglassesAltitude: (value: number) => void;
	vatglassesAuto: boolean;
	setVatglassesAuto: (value: boolean) => void;
};

export const useMapVisibilityStore = create<MapVisibilityState>()(
	persist(
		(set) => ({
			_hasHydrated: false,
			isHidden: false,
			setHidden: (value: boolean) => set({ isHidden: value }),
			vatglasses: false,
			setVatglasses: (value: boolean) => set({ vatglasses: value }),
			vatglassesAltitude: 0,
			setVatglassesAltitude: (value: number) => set({ vatglassesAltitude: value }),
			vatglassesAuto: false,
			setVatglassesAuto: (value: boolean) => set({ vatglassesAuto: value }),
		}),
		{
			name: "simradar21-map-visibility",
			onRehydrateStorage: () => (state) => {
				if (state) {
					state._hasHydrated = true;
				}
			},
		},
	),
);

export const useMinimizedPanelsStore = create<{ minimized: boolean; setMinimized: (value: boolean) => void }>()(
	persist(
		(set) => ({
			minimized: false,
			setMinimized: (value: boolean) => set({ minimized: value }),
		}),
		{
			name: "simradar21-all-panels-minimized",
		},
	),
);

export const useDashboardPanelStore = create<DashboardPanelState>()(
	persist(
		(set) => ({
			panel: ["history", "stats"],
			historyMode: "24 hours",
			eventsToday: true,
			eventsTomorrow: true,

			setPanel: (panel) => set({ panel }),
			setHistoryMode: (value) => set({ historyMode: value }),
			setEventsToday: (value) => set({ eventsToday: value }),
			setEventsTomorrow: (value) => set({ eventsTomorrow: value }),
		}),
		{
			name: "simradar21-dashboard-panel-state",
		},
	),
);

export const usePilotPanelStore = create<PilotPanelState>()(
	persist(
		(set) => ({
			panel: [],
			setPanel: (panel) => set({ panel }),
		}),
		{
			name: "simradar21-pilot-panel-state",
		},
	),
);

export const useAirportPanelStore = create<AirportPanelState>()(
	persist(
		(set) => ({
			panel: [],
			setPanel: (panel) => set({ panel }),
		}),
		{
			name: "simradar21-airport-panel-state",
		},
	),
);

export const useSectorPanelStore = create<SectorPanelState>()(
	persist(
		(set) => ({
			panel: [],
			setPanel: (panel) => set({ panel }),
		}),
		{
			name: "simradar21-sector-panel-state",
		},
	),
);

type ManualPage = "settings" | "filters" | null;
export const useMapPageStore = create<{ manualPage: ManualPage; setManualPage: (page: ManualPage) => void }>((set) => ({
	manualPage: null,
	setManualPage: (page) => set({ manualPage: page }),
}));
