import type { AirportShort, ControllerMerged } from "@sr24/types/interface";
import { type Feature, Overlay } from "ol";
import type { Point } from "ol/geom";
import type { ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { AirportOverlay, PilotOverlay, SectorOverlay } from "@/components/Map/Overlays";
import { getCachedAirline, getCachedAirport, getCachedFir, getCachedTracon } from "@/storage/cache";

async function getPilotOverlay(feature: Feature<Point>, mini?: boolean): Promise<ReactNode> {
	const id = feature.get("callsign") as string;
	const icao = id.substring(0, 3);
	const airline = await getCachedAirline(icao);
	return <PilotOverlay feature={feature} airline={airline} mini={mini} />;
}

async function getAirportOverlay(feature: Feature<Point>, short?: AirportShort, merged?: ControllerMerged, mini?: boolean): Promise<ReactNode> {
	const id =
		feature
			.getId()
			?.toString()
			.replace(/^airport_/, "") || "";

	const cached = await getCachedAirport(id);
	return <AirportOverlay cached={cached} short={short} merged={merged} mini={mini} />;
}

async function getSectorOverlay(feature: Feature<Point>, merged?: ControllerMerged, mini?: boolean): Promise<ReactNode> {
	const id =
		feature
			.getId()
			?.toString()
			.replace(/^sector_/, "") || "";
	const type = feature.get("type");

	if (type === "tracon") {
		let cachedTracon = await getCachedTracon(id);
		if (!cachedTracon) {
			const cachedAirport = await getCachedAirport(id);
			if (cachedAirport) {
				cachedTracon = {
					properties: {
						id: cachedAirport.id,
						name: cachedAirport.name.replace("Airport", "Radar"),
						prefix: "",
					},
					type: "Feature",
					geometry: {
						type: "MultiPolygon",
						coordinates: [],
					},
				};
			}
		}
		return <SectorOverlay cached={cachedTracon} merged={merged} mini={mini} />;
	} else {
		const cachedFir = await getCachedFir(id);
		return <SectorOverlay cached={cachedFir} merged={merged} mini={mini} />;
	}
}

export async function createOverlay(
	feature: Feature<Point>,
	airport: AirportShort | undefined,
	controller: ControllerMerged | undefined,
	mini?: boolean,
): Promise<Overlay> {
	const element = document.createElement("div");
	const root = createRoot(element);
	const type = feature.get("type");

	if (type === "pilot") {
		const node = await getPilotOverlay(feature, mini);
		root.render(node);
	}

	if (type === "airport") {
		const node = await getAirportOverlay(feature, airport, controller, mini);
		root.render(node);
	}

	if (type === "fir" || type === "tracon") {
		const node = await getSectorOverlay(feature, controller, mini);
		root.render(node);
	}

	const overlay = new Overlay({
		element,
		id: feature.getId(),
		position: feature.getGeometry()?.getCoordinates(),
		positioning: "bottom-center",
		offset: [0, -25],
		insertFirst: false,
	});
	overlay.set("root", root);

	return overlay;
}

export async function updateOverlay(
	feature: Feature<Point>,
	overlay: Overlay,
	airport: AirportShort | undefined,
	controller: ControllerMerged | undefined,
	mini?: boolean,
): Promise<void> {
	const geom = feature.getGeometry();
	const coords = geom?.getCoordinates();
	overlay.setPosition(coords);

	const root = overlay.get("root") as Root | undefined;
	const type = feature.get("type") as string | undefined;

	if (!root || !type) return;

	if (type === "pilot") {
		const node = await getPilotOverlay(feature, mini);
		root.render(node);
	}

	if (type === "airport") {
		const node = await getAirportOverlay(feature, airport, controller, mini);
		root.render(node);
	}

	if (type === "fir" || type === "tracon") {
		const node = await getSectorOverlay(feature, controller, mini);
		root.render(node);
	}
}
