"use client";

import useMediaQuery from "@mui/material/useMediaQuery";
import type { StaticAirport } from "@sr24/types/db";
import { useEffect, useState } from "react";
import AirportConnections from "@/components/Panel/Airport/AirportConnections";
import AirportController from "@/components/Panel/Airport/AirportController";
import AirportExpected from "@/components/Panel/Airport/AirportExpected";
import { AirportStatus } from "@/components/Panel/Airport/AirportStatus";
import { AirportWeather } from "@/components/Panel/Airport/AirportWeather";
import { Accordion } from "@/components/ui/accordion";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { getCachedAirport } from "@/storage/cache";
import { useAirportPanelStore } from "@/storage/zustand";

export default function AirportPanel({ icao }: { icao: string }) {
	const [staticAirport, setStaticAirport] = useState<StaticAirport | null>(null);
	const { panel, setPanel } = useAirportPanelStore();
	const isMobile = useMediaQuery("(max-width: 1024px)");

	useEffect(() => {
		getCachedAirport(icao).then(setStaticAirport);
	}, [icao]);

	if (!staticAirport) return null;

	return (
		<>
			<div className="p-2 pb-0 bg-muted/50 flex flex-col gap-2">
				<AirportStatus icao={icao} />
				<AirportExpected icao={icao} />
			</div>
			<ScrollArea className="max-h-full overflow-hidden flex flex-col">
				<Accordion multiple={!isMobile} className="rounded-none border-none" value={panel} onValueChange={setPanel}>
					<AirportWeather icao={icao} />
					<AirportConnections icao={icao} />
					<AirportController icao={icao} />
				</Accordion>
				<ScrollBar />
			</ScrollArea>
		</>
	);
}
