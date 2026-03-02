"use client";

import type { DeltaTrackPoint, PilotLong, TrackPoint } from "@sr24/types/interface";
import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import LoadingPanel from "@/components/Panel/Loading";
import NotFoundPanel from "@/components/Panel/NotFound";
import { PilotHeader } from "@/components/Panel/Pilot/PilotHeader";
import PilotRoute, { PilotProgress } from "@/components/Panel/Pilot/PilotRoute";
import { PilotTelemetry } from "@/components/Panel/Pilot/PilotTelemetry";
import { fetchApi } from "@/lib/api";
import { decodeTrackPoints } from "@/lib/map/tracks";
import { type WsData, type WsPresence, wsClient } from "@/lib/ws";
import { mapService } from "../../lib";

export default function MultiPilotPanel({ id, removeSelected }: { id: string; removeSelected: (id: string) => void }) {
	const {
		data: pilotData,
		isLoading,
		mutate: setPilotData,
	} = useSWR<PilotLong>(`/map/pilot/${id}`, fetchApi, {
		refreshInterval: 60_000,
	});

	const [minimized, setMinimized] = useState(false);
	const lastMessageSeqRef = useRef<number | null>(null);

	useEffect(() => {
		fetchApi<(TrackPoint | DeltaTrackPoint)[]>(`/map/pilot/${id}/track`).then((masked) => {
			const trackPoints = decodeTrackPoints(masked);
			mapService.setFeatures({ trackPoints, autoTrackId: id });
		});
		lastMessageSeqRef.current = null;
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
				if (lastMessageSeqRef.current && msg.s !== (lastMessageSeqRef.current + 1) % Number.MAX_SAFE_INTEGER) {
					console.warn(`Missed WS messages: last seq ${lastMessageSeqRef.current}, current seq ${msg.s}. Refetching trackpoints.`);
					fetchApi<(TrackPoint | DeltaTrackPoint)[]>(`/map/pilot/${id}/track`).then((masked) => {
						const trackPoints = decodeTrackPoints(masked);
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
					}
				}
				lastMessageSeqRef.current = msg.s;
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
				onClick={() => removeSelected(`pilot_${id}`)}
			/>
		);

	return (
		<div className="max-h-full glass-panel rounded-md pointer-events-auto overflow-hidden flex flex-col">
			<PilotHeader size="sm" pilot={pilotData} onClose={() => removeSelected(`pilot_${id}`)} minimized={minimized} setMinimized={setMinimized} />
			{!minimized && (
				<div className="bg-muted/50 flex flex-col gap-1 px-1.5 py-1">
					<div className="flex items-center justify-between gap-2">
						<PilotRoute pilot={pilotData} size="sm" />
						<PilotTelemetry pilot={pilotData} size="sm" />
					</div>
					<PilotProgress pilot={pilotData} size="sm" />
				</div>
			)}
		</div>
	);
}
