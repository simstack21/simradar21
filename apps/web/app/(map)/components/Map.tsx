"use client";

import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { useEffect } from "react";
import { useFiltersStore, useMapVisibilityStore, useSettingsStore } from "@/storage/zustand";
import { init, mapService } from "../lib";

export default function OMap() {
	const router = useRouter();
	const pathname = usePathname();

	const { data: session } = useSession();

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
		navigraphData,
		navigraphGates,
		navigraphRoutes,
		navigraphRoutesInMulti,
	} = useSettingsStore();
	const filters = useFiltersStore();
	const { vatglassesAltitude, setVatglassesAltitude, vatglasses, vatglassesAuto, _hasHydrated } = useMapVisibilityStore();

	useEffect(() => {
		const map = mapService.init({
			onNavigate: (href) => router.push(href),
			autoTrackPoints: true,
			onVatglassesAltitudeChange: setVatglassesAltitude,
		});

		mapService.addEventListeners();

		return () => {
			mapService.removeEventListeners();
			map.setTarget(undefined);
		};
	}, [router, setVatglassesAltitude]);

	useEffect(() => {
		init(pathname);
	}, [pathname]);

	useEffect(() => {
		mapService.setTheme(theme);
	}, [theme]);

	useEffect(() => {
		mapService.setFilters(filters);
	}, [filters]);

	useEffect(() => {
		if (!_hasHydrated) return;
		mapService.setVatglasses({ vatglasses, vatglassesAltitude, vatglassesAuto });
	}, [_hasHydrated, vatglasses, vatglassesAltitude, vatglassesAuto]);

	useEffect(() => {
		mapService.setVatglasses({ cid: session?.vatsim?.cid });
	}, [session?.vatsim?.cid]);

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
			navigraphData,
			navigraphGates,
			navigraphRoutes,
			navigraphRoutesInMulti,
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
		navigraphData,
		navigraphGates,
		navigraphRoutes,
		navigraphRoutesInMulti,
	]);

	return (
		<div className="absolute inset-0 flex flex-col justify-end">
			<div id="map" className="absolute inset-0" />
			<div className="w-full h-10 z-50"></div>
		</div>
	);
}
