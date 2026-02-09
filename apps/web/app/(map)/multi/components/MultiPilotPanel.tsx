"use client";

import type { DeltaTrackPoint, PilotLong, TrackPoint } from "@sr24/types/interface";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import flightStatusSprite from "@/assets/images/sprites/flightStatusSprite.png";
import Icon, { getAirlineIcon } from "@/components/Icon/Icon";
import Spinner from "@/components/Spinner/Spinner";
import { fetchApi } from "@/lib/api";
import { convertTime } from "@/lib/helpers";
import { decodeTrackPoints } from "@/lib/map/tracks";
import { getDelayColorFromDates, getSpriteOffset } from "@/lib/panels";
import { type WsData, type WsPresence, wsClient } from "@/lib/ws";
import { getCachedAirline, getCachedAirport } from "@/storage/cache";
import { useSettingsStore } from "@/storage/zustand";
import type { PilotPanelStatic } from "@/types/panels";
import { mapService } from "../../lib";

export default function MultiPilotPanel({ id }: { id: string }) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const pathname = usePathname();

	const {
		data: pilotData,
		isLoading,
		mutate: setPilotData,
	} = useSWR<PilotLong>(`/map/pilot/${id}`, fetchApi, {
		refreshInterval: 60_000,
		keepPreviousData: true,
	});

	const lastMessageSeqRef = useRef<number | null>(null);

	const [_trackPoints, setTrackPoints] = useState<TrackPoint[]>([]);
	const [staticData, setStaticData] = useState<PilotPanelStatic>({
		airline: null,
		departure: null,
		arrival: null,
	});

	const { timeFormat, timeZone } = useSettingsStore();

	const removeId = () => {
		const selected = searchParams.get("selected");
		if (!selected) return;

		const updated = selected.split(",").filter((foundId) => foundId !== `pilot_${id}`);
		const params = new URLSearchParams(searchParams.toString());

		if (updated.length === 0) {
			params.delete("selected");
		} else {
			params.set("selected", updated.join(","));
		}

		router.replace(`${pathname}?${params.toString()}`, { scroll: false });
	};

	useEffect(() => {
		fetchApi<(TrackPoint | DeltaTrackPoint)[]>(`/map/pilot/${id}/track`).then((masked) => {
			const trackPoints = decodeTrackPoints(masked);
			setTrackPoints(trackPoints);
			mapService.setFeatures({ trackPoints, autoTrackId: id });
		});
		lastMessageSeqRef.current = null;
	}, [id]);

	useEffect(() => {
		if (!pilotData) return;

		const airlineCode = pilotData.callsign.slice(0, 3).toUpperCase();
		(async () => {
			Promise.all([
				getCachedAirline(airlineCode || ""),
				getCachedAirport(pilotData.flight_plan?.departure.icao || ""),
				getCachedAirport(pilotData.flight_plan?.arrival.icao || ""),
			]).then(([airline, departure, arrival]) => {
				setStaticData({ airline, departure, arrival });
			});
		})();
	}, [pilotData]);

	useEffect(() => {
		const handleMessage = (msg: WsData | WsPresence) => {
			if (msg.t === "delta") {
				if (lastMessageSeqRef.current && msg.s !== (lastMessageSeqRef.current + 1) % Number.MAX_SAFE_INTEGER) {
					console.warn(`Missed WS messages: last seq ${lastMessageSeqRef.current}, current seq ${msg.s}. Refetching trackpoints.`);
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
				lastMessageSeqRef.current = msg.s;
			}
		};

		wsClient.addListener(handleMessage);

		return () => {
			wsClient.removeListener(handleMessage);
		};
	}, [id, setPilotData]);

	if (isLoading)
		return (
			<div className="panel">
				<Spinner relative />
			</div>
		);
	if (!pilotData) return <div>Multi Pilot Panel for {id} not found</div>;

	const callsignNumber = pilotData.callsign.slice(3);
	const flightNumber = staticData.airline?.iata ? staticData.airline.iata + callsignNumber : pilotData.callsign;

	return (
		<div className="panel" style={{ gap: 5 }}>
			<div className="mini-panel-header">
				<div className="mini-panel-id">{pilotData.callsign}</div>
				<div className="mini-panel-tags">
					<div className="mini-panel-tag r">{flightNumber}</div>
					<div className="mini-panel-tag g">{pilotData.aircraft}</div>
				</div>
				<button className="mini-panel-single-view" type="button" onClick={() => router.replace(`/pilot/${id.replace("pilot_", "")}`)}>
					<Icon name="eye" size={20} />
				</button>
				<button className="mini-panel-close" type="button" onClick={() => removeId()}>
					<Icon name="cancel" size={24} />
				</button>
			</div>
			<div className="mini-panel-container mini-panel-title">
				<div className="mini-panel-icon" style={{ backgroundColor: staticData.airline?.color?.[0] ?? "" }}>
					{getAirlineIcon(staticData.airline)}
				</div>
				<div className="mini-panel-title">
					<p>{staticData.airline?.name}</p>
				</div>
			</div>
			<div className="mini-panel-container mini-panel-content">
				<div className="mini-panel-pilot-route">
					<p>{convertTime(pilotData.times?.off_block, timeFormat, timeZone, false, staticData.departure?.timezone)}</p>
					<p>{staticData.departure?.id}</p>
					<div
						className="mini-panel-pilot-route-icon"
						style={{
							backgroundImage: `url(${flightStatusSprite.src})`,
							backgroundPositionY: `${getSpriteOffset(pilotData.times?.state)}px`,
						}}
					></div>
					<p>{staticData.arrival?.id}</p>
					<p>
						<span className={`delay-indicator ${getDelayColorFromDates(pilotData.times?.sched_on_block, pilotData.times?.on_block) ?? ""}`}></span>
						{convertTime(pilotData.times?.on_block, timeFormat, timeZone, false, staticData.arrival?.timezone)}
					</p>
				</div>
			</div>
		</div>
	);
}
