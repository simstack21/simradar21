"use client";

import useMediaQuery from "@mui/material/useMediaQuery";
import type { DeltaTrackPoint, PilotLong, TrackPoint } from "@sr24/types/interface";
import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { mapService } from "@/app/(map)/lib";
import LoadingPanel from "@/components/Panel/Loading";
import NotFoundPanel from "@/components/Panel/NotFound";
import { MotionPanel } from "@/components/Panel/PanelGrid";
import { PilotAircraft } from "@/components/Panel/Pilot/PilotAircraft";
import { PilotChart } from "@/components/Panel/Pilot/PilotChart";
import { PilotFlightplan } from "@/components/Panel/Pilot/PilotFlightplan";
import { PilotFooter } from "@/components/Panel/Pilot/PilotFooter";
import { PilotHeader } from "@/components/Panel/Pilot/PilotHeader";
import { PilotMisc } from "@/components/Panel/Pilot/PilotMisc";
import PilotRoute from "@/components/Panel/Pilot/PilotRoute";
import { PilotTelemetry } from "@/components/Panel/Pilot/PilotTelemetry";
import { PilotUser } from "@/components/Panel/Pilot/PilotUser";
import { Accordion } from "@/components/ui/accordion";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchApi } from "@/lib/api";
import { decodeTrackPoints } from "@/lib/map/tracks";
import { type WsData, type WsPresence, wsClient } from "@/lib/ws";
import { usePilotPanelStore } from "@/storage/zustand";
import PilotProcedures from "./PilotProcedures";

let lastMessageSeq: number | null = null;

export default function PilotPanel({ id }: { id: string }) {
	const {
		data: pilotData,
		isLoading,
		mutate: setPilotData,
	} = useSWR<PilotLong>(`/map/pilot/${id}`, fetchApi, {
		refreshInterval: 60_000,
	});

	const { panel, setPanel } = usePilotPanelStore();
	const [minimized, setMinimized] = useState(false);
	const [tab, setTab] = useState("overview");
	const [trackPoints, setTrackPoints] = useState<TrackPoint[]>([]);
	const isMobile = useMediaQuery("(max-width: 1024px)");

	useEffect(() => {
		fetchApi<(TrackPoint | DeltaTrackPoint)[]>(`/map/pilot/${id}/track`).then((masked) => {
			const trackPoints = decodeTrackPoints(masked);
			setTrackPoints(trackPoints);
			mapService.setFeatures({ trackPoints, autoTrackId: id });
		});
		lastMessageSeq = null;
	}, [id]);

	const routeRef = useRef<string | null>(null);

	useEffect(() => {
		if (pilotData?.flight_plan?.parsed_route && pilotData.flight_plan.route !== routeRef.current) {
			mapService.setFeatures({ autoTrackId: pilotData.id, route: pilotData.flight_plan.parsed_route });
			routeRef.current = pilotData.flight_plan.route;
		}
	}, [pilotData]);

	useEffect(() => {
		const handleMessage = (msg: WsData | WsPresence) => {
			if (msg.t === "delta") {
				if (lastMessageSeq && msg.s !== (lastMessageSeq + 1) % Number.MAX_SAFE_INTEGER) {
					console.warn(`Missed WS messages: last seq ${lastMessageSeq}, current seq ${msg.s}. Refetching trackpoints.`);
					fetchApi<(TrackPoint | DeltaTrackPoint)[]>(`/map/pilot/${id}/track`).then((masked) => {
						const trackPoints = decodeTrackPoints(masked);
						setTrackPoints(trackPoints);
						mapService.setFeatures({ trackPoints, autoTrackId: id });
					});
				} else {
					const updatedPilot = msg.data.pilots.updated.find((p) => p.id === id);

					if (updatedPilot) {
						setPilotData((prev) => {
							if (!prev) return prev;
							return {
								...prev,
								...updatedPilot,
							};
						}, false);

						setTrackPoints((prev) => [
							...prev,
							{
								id: updatedPilot.id,
								coordinates: [0, 0],
								altitude_ms: updatedPilot.altitude_ms ?? prev[prev.length - 1]?.altitude_ms,
								groundspeed: updatedPilot.groundspeed ?? prev[prev.length - 1]?.groundspeed,
								color: "transparent",
								timestamp: Date.now(),
							},
						]);
					}
				}
				lastMessageSeq = msg.s;
			}
		};

		wsClient.addListener(handleMessage);
		return () => {
			wsClient.removeListener(handleMessage);
		};
	}, [id, setPilotData]);

	if (isLoading) return <LoadingPanel />;
	if (!pilotData)
		return (
			<NotFoundPanel
				title="Pilot not found"
				description="This pilot does not exist or is currently unavailable, most likely because of an incorrect ID or disconnect."
				onClick={() => mapService.resetMap()}
			/>
		);

	return (
		<MotionPanel className="max-h-full glass-panel rounded-md pointer-events-auto overflow-hidden flex flex-col">
			<PilotHeader pilot={pilotData} onClose={() => mapService.resetMap()} minimized={minimized} setMinimized={setMinimized} />
			{!minimized && (
				<>
					<Tabs value={tab} onValueChange={setTab}>
						<TabsList variant="line" className="w-full">
							<TabsTrigger value="overview">Overview</TabsTrigger>
							<TabsTrigger value="procedures">Procedures</TabsTrigger>
						</TabsList>
					</Tabs>
					<PilotRoute pilot={pilotData} />
					{tab === "overview" ? (
						<ScrollArea className="max-h-full overflow-hidden flex flex-col">
							<Accordion multiple={!isMobile} className="rounded-none border-none" value={panel} onValueChange={setPanel}>
								<PilotFlightplan pilot={pilotData} />
								<PilotAircraft pilot={pilotData} />
								<PilotChart trackPoints={trackPoints} />
								<PilotTelemetry pilot={pilotData} />
								<PilotUser pilot={pilotData} />
								<PilotMisc pilot={pilotData} />
							</Accordion>
							<ScrollBar />
						</ScrollArea>
					) : (
						<PilotProcedures pilot={pilotData} />
					)}
				</>
			)}
			<PilotFooter pilot={pilotData} mapService={mapService} />
		</MotionPanel>
	);
}
