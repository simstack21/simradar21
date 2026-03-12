"use client";

import type { InitialData } from "@sr24/types/interface";
import { fetchApi } from "@/lib/api";
import { MapService } from "@/lib/map/MapService";
import { type WsMessage, wsClient } from "@/lib/ws";
import { dxGetAllAirports } from "@/storage/dexie";

export const mapService = new MapService();

let initialized = false;

export async function init(pathname: string): Promise<void> {
	if (initialized) {
		mapService.setView({ multi: pathname.startsWith("/multi") });
		setClickedFromPath(pathname);
		return;
	}

	const data = await fetchApi<InitialData>("/map/init");
	const staticAirports = await dxGetAllAirports();

	mapService.setStore({ airports: data.airports, controllers: data.controllers });
	await mapService.setFeatures({ pilots: data.pilots, airports: staticAirports, controllers: data.controllers });

	const handleMessage = async (msg: WsMessage) => {
		if (msg.t !== "delta") return;

		mapService.updateStore({ airports: msg.data.airports, controllers: msg.data.controllers });
		await mapService.updateFeatures({ pilots: msg.data.pilots, controllers: msg.data.controllers });
	};
	wsClient.addListener(handleMessage);

	mapService.setView({ multi: pathname.startsWith("/multi") });
	setClickedFromPath(pathname);
	initialized = true;
}

wsClient.setRevalidateFunction(revalidate);
async function revalidate(): Promise<void> {
	const data = await fetchApi<InitialData>("/map/init");
	mapService.setStore({ airports: data.airports, controllers: data.controllers });
	await mapService.setFeatures({ pilots: data.pilots, controllers: data.controllers });
}

function setClickedFromPath(pathname: string): void {
	if (pathname.startsWith("/multi")) {
		const selected = new URLSearchParams(window.location.search).get("selected");
		const ids = selected ? selected.split(",") : [];

		for (const fullId of ids) {
			const [type, id] = fullId.split(/_(.+)/);
			if (!type || !id) continue;
			mapService.addClickFeature(type, id, !initialized);
		}
	} else {
		const [type, id] = pathname.split("/").slice(1, 3);
		mapService.addClickFeature(type, id, !initialized);
	}
}
