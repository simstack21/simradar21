"use client";

import type { StaticAirport } from "@sr24/types/db";
import type { AirportLong } from "@sr24/types/interface";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { mapService } from "@/app/(map)/lib";
import { AirportFooter } from "@/components/Panel/Airport/AirportFooter";
import { AirportHeader } from "@/components/Panel/Airport/AirportHeader";
import AirportNavigation from "@/components/Panel/Airport/AirportNavigation";
import LoadingPanel from "@/components/Panel/Loading";
import NotFoundPanel from "@/components/Panel/NotFound";
import { MotionPanel } from "@/components/Panel/PanelGrid";
import { fetchApi } from "@/lib/api";
import { getCachedAirport } from "@/storage/cache";
import { useMinimizedPanelsStore } from "@/storage/zustand";

export default function AirportLayout({ icao, children }: { icao: string; children?: React.ReactNode }) {
	const { isLoading } = useSWR<AirportLong>(`/map/airport/${icao}`, fetchApi, {
		refreshInterval: 60_000,
		shouldRetryOnError: false,
	});

	const [staticAirport, setStaticAirport] = useState<StaticAirport | null | undefined>();
	const { minimized, setMinimized } = useMinimizedPanelsStore();

	useEffect(() => {
		getCachedAirport(icao).then(setStaticAirport);
	}, [icao]);

	if (isLoading || staticAirport === undefined) return <LoadingPanel />;
	if (!staticAirport)
		return <NotFoundPanel title="Airport not found" description="This airport does not exist." onClick={() => mapService.resetMap()} />;

	return (
		<MotionPanel className="max-h-full glass-panel rounded-md pointer-events-auto overflow-hidden flex flex-col">
			<AirportHeader icao={icao} onClose={() => mapService.resetMap()} minimized={minimized} setMinimized={setMinimized} />
			<AirportNavigation icao={icao} />
			{!minimized && children}
			<AirportFooter icao={icao} mapService={mapService} />
		</MotionPanel>
	);
}
