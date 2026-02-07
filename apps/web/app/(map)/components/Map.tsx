"use client";

import { useEffect } from "react";
import "./Map.css";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import Initializer from "@/components/Initializer/Initializer";
import BasePanel from "@/components/Panel/BasePanel";
import { useFilterStatsStore, useSettingsStore } from "@/storage/zustand";
import { init, mapService } from "../lib";
import ActiveFilters from "./ActiveFilters";

export default function OMap({ children }: { children?: React.ReactNode }) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const { theme } = useTheme();
	const {
		dayNightLayer,
		dayNightLayerBrightness,
		airportMarkers,
		airportMarkerSize,
		planeMarkerSize,
		animatedPlaneMarkers,
		sectorAreas,
		traconColor,
		firColor,
	} = useSettingsStore();
	const { setPilotCount } = useFilterStatsStore();

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
		mapService.setSettings({
			dayNightLayer,
			dayNightLayerBrightness,
			airportMarkers,
			airportMarkerSize,
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
		planeMarkerSize,
		sectorAreas,
		traconColor,
		firColor,
		animatedPlaneMarkers,
	]);

	return (
		<>
			<Initializer />
			<BasePanel>{children}</BasePanel>
			<ActiveFilters />
			<div id="map" />
		</>
	);
}
