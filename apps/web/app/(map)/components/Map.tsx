"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect } from "react";
import { useFilterStatsStore, useFiltersStore, useSettingsStore } from "@/storage/zustand";
import { init, mapService } from "../lib";

export default function OMap() {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const { theme } = useTheme();
	const {
		dayNightLayer,
		dayNightLayerBrightness,
		airportMarkers,
		airportMarkerSize,
		planeMarkers,
		planeMarkerSize,
		animatedPlaneMarkers,
		sectorAreas,
		traconColor,
		firColor,
	} = useSettingsStore();
	const { setPilotCount } = useFilterStatsStore();
	const filters = useFiltersStore();

	useEffect(() => {
		const map = mapService.init({ onNavigate: (href) => router.push(href), autoTrackPoints: true });

		mapService.addEventListeners();
		mapService.subscribe((stats) => {
			setPilotCount([stats.pilots.rendered, stats.pilots.total]);
		});

		return () => {
			mapService.removeEventListeners();
			map.setTarget(undefined);
		};
	}, [router, setPilotCount]);

	useEffect(() => {
		init(pathname, searchParams);
	}, [pathname, searchParams]);

	useEffect(() => {
		mapService.setTheme(theme);
	}, [theme]);

	useEffect(() => {
		mapService.setFilters(filters);
	}, [filters]);

	useEffect(() => {
		mapService.setSettings({
			dayNightLayer,
			dayNightLayerBrightness,
			airportMarkers,
			airportMarkerSize,
			planeMarkers,
			planeMarkerSize,
			sectorAreas,
			traconColor,
			firColor,
			animatedPlaneMarkers,
		});
	}, [
		dayNightLayer,
		dayNightLayerBrightness,
		airportMarkers,
		airportMarkerSize,
		planeMarkers,
		planeMarkerSize,
		sectorAreas,
		traconColor,
		firColor,
		animatedPlaneMarkers,
	]);

	return <div id="map" className="absolute inset-0" />;
}
