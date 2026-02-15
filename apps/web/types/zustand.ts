import type { RgbaColor } from "react-colorful";

type Theme = "light" | "dark" | "system";
type PlaneOverlayMode = "callsign" | "telemetry-off" | "full";
type ControllerOverlayMode = "callsign" | "controller-off" | "full";
type TimeZone = "local" | "utc";
type TimeFormat = "24h" | "12h";
type TemperatureUnit = "celsius" | "fahrenheit";
type SpeedUnit = "knots" | "kmh" | "mph" | "ms";
type VerticalSpeedUnit = "fpm" | "ms";
type AltitudeUnit = "feet" | "meters";
type DistanceUnit = "km" | "miles" | "nm";

export interface SettingValues {
	theme: Theme;
	dayNightLayer: boolean;
	dayNightLayerBrightness: number;
	airportMarkers: boolean;
	airportOverlay: ControllerOverlayMode;
	airportMarkerSize: number;
	planeMarkers: boolean;
	planeOverlay: PlaneOverlayMode;
	planeMarkerSize: number;
	animatedPlaneMarkers: boolean;
	sectorAreas: boolean;
	sectorOverlay: ControllerOverlayMode;
	traconColor: RgbaColor;
	firColor: RgbaColor;
	timeZone: TimeZone;
	timeFormat: TimeFormat;
	temperatureUnit: TemperatureUnit;
	speedUnit: SpeedUnit;
	verticalSpeedUnit: VerticalSpeedUnit;
	windSpeedUnit: SpeedUnit;
	altitudeUnit: AltitudeUnit;
	distanceUnit: DistanceUnit;
}

export type MapSettings = Pick<
	SettingValues,
	| "dayNightLayer"
	| "dayNightLayerBrightness"
	| "airportMarkers"
	| "airportOverlay"
	| "airportMarkerSize"
	| "planeMarkers"
	| "planeOverlay"
	| "planeMarkerSize"
	| "animatedPlaneMarkers"
	| "sectorAreas"
	| "sectorOverlay"
	| "traconColor"
	| "firColor"
>;

export type UnitSettings = Pick<
	SettingValues,
	"theme" | "timeZone" | "timeFormat" | "temperatureUnit" | "speedUnit" | "verticalSpeedUnit" | "windSpeedUnit" | "altitudeUnit" | "distanceUnit"
>;

export interface SettingState extends SettingValues {
	setTheme: (value: Theme) => void;
	setDayNightLayer: (value: boolean) => void;
	setDayNightLayerBrightness: (value: number) => void;
	setAirportMarkers: (value: boolean) => void;
	setAirportOverlay: (value: ControllerOverlayMode) => void;
	setAirportMarkerSize: (value: number) => void;
	setPlaneMarkers: (value: boolean) => void;
	setPlaneOverlay: (value: PlaneOverlayMode) => void;
	setPlaneMarkerSize: (value: number) => void;
	setAnimatedPlaneMarkers: (value: boolean) => void;
	setSectorAreas: (value: boolean) => void;
	setSectorOverlay: (value: ControllerOverlayMode) => void;
	setTraconColor: (value: RgbaColor) => void;
	setFirColor: (value: RgbaColor) => void;
	setTimeZone: (value: TimeZone) => void;
	setTimeFormat: (value: TimeFormat) => void;
	setTemperatureUnit: (value: TemperatureUnit) => void;
	setSpeedUnit: (value: SpeedUnit) => void;
	setVerticalSpeedUnit: (value: VerticalSpeedUnit) => void;
	setWindSpeedUnit: (value: SpeedUnit) => void;
	setAltitudeUnit: (value: AltitudeUnit) => void;
	setDistanceUnit: (value: DistanceUnit) => void;

	setSettings: (settings: SettingValues) => void;
	resetAllSettings: () => void;
	resetMapSettings: () => void;
	resetUnitSettings: () => void;
}

export interface FilterValues {
	active: boolean;
	airline: string[];
	callsign: string[];
	type: string[];
	registration: string[];
	departure: string[];
	arrival: string[];
	anyAirport: string[];
	altitude: [number, number];
	groundspeed: [number, number];
	squawk: string[];
	rules: string[];
}

export type FilterKey = Exclude<keyof FilterValues, "active">;

export type FilterInputType = "select" | "range";

export type FilterOption = {
	value: string;
	label: string;
};

export type FilterDefinition<K extends FilterKey = FilterKey> = {
	key: K;
	label: string;
	description: string;
	category: string;
	input: FilterInputType;

	options?: FilterOption[] | ((inputValue: string) => Promise<FilterOption[]>);
	uppercase?: boolean;
	extendedOptions?: boolean;

	min?: number;
	max?: number;
};

type FilterPreset = {
	id: string;
	name: string;
	values: FilterValues;
	createdAt: number;
};

export interface FilterState extends FilterValues {
	activeFilters: FilterKey[];
	addFilter: (key: FilterKey) => void;
	removeFilter: (key: FilterKey) => void;
	setFilterValue: <K extends FilterKey>(key: K, value: FilterValues[K]) => void;
	clearFilters: () => void;
	savedPresets: FilterPreset[];
	savePreset: (name: string) => void;
	deletePreset: (id: string) => void;
	applyPreset: (id: string) => void;
}

export interface FilterStats {
	pilotCount: [number, number];
	setPilotCount: (count: [number, number]) => void;
}

type DashboardPanel = "history" | "stats" | "events";

export interface DashboardPanelValues {
	panel: DashboardPanel[];
	historyMode: "24 hours" | "7 days";
	eventsToday: boolean;
	eventsTomorrow: boolean;
}

export interface DashboardPanelState extends DashboardPanelValues {
	setPanel: (panel: DashboardPanel[]) => void;
	setHistoryMode: (value: "24 hours" | "7 days") => void;
	setEventsToday: (value: boolean) => void;
	setEventsTomorrow: (value: boolean) => void;
}

type PilotPanel = "flightplan" | "aircraft" | "chart" | "telemetry" | "user" | "misc";

export interface PilotPanelValues {
	panel: PilotPanel[];
}

export interface PilotPanelState extends PilotPanelValues {
	setPanel: (panel: PilotPanel[]) => void;
}

type AirportPanel = "weather" | "connections" | "controller";

export interface AirportPanelValues {
	panel: AirportPanel[];
}

export interface AirportPanelState extends AirportPanelValues {
	setPanel: (panel: AirportPanel[]) => void;
}

type SectorPanel = "connections";

export interface SectorPanelValues {
	panel: SectorPanel[];
}

export interface SectorPanelState extends SectorPanelValues {
	setPanel: (panel: SectorPanel[]) => void;
}
