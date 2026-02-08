"use client";

import type { DeltaTrackPoint, PilotLong, TrackPoint } from "@sr24/types/interface";
import { SnailIcon } from "lucide-react";
import { toLonLat } from "ol/proj";
import { useEffect, useState } from "react";
import useSWR from "swr";
import Spinner from "@/components/Spinner/Spinner";
import { fetchApi } from "@/lib/api";
import { decodeTrackPoints } from "@/lib/map/tracks";
import { init, updatePilot } from "../../lib";
import ReplayControls from "./ReplayControls";
import ReplayMap from "./ReplayMap";

interface ApiData {
	pilot: PilotLong;
	trackPoints?: (TrackPoint | DeltaTrackPoint)[];
}

export const REPLAY_SPEEDS = [1, 2, 4, 8, 16];

export function Replay({ id }: { id: string }) {
	const { data, isLoading } = useSWR<ApiData>(`/data/pilot/${id}`, fetchApi, {
		revalidateIfStale: false,
		revalidateOnFocus: false,
		shouldRetryOnError: false,
	});
	const [trackPoints, setTrackPoints] = useState<Required<TrackPoint>[]>([]);

	const [progress, setProgress] = useState(0);
	const [playing, setPlaying] = useState(false);
	const [speedIndex, setSpeedIndex] = useState(3);

	useEffect(() => {
		if (!data) return;

		const trackPoints = decodeTrackPoints(data.trackPoints, true);
		setTrackPoints(trackPoints);
		init(data.pilot, trackPoints);
	}, [data]);

	useEffect(() => {
		updatePilot(trackPoints[progress]);
	}, [progress, trackPoints]);

	useEffect(() => {
		if (!playing) return;
		if (trackPoints.length === 0) return;

		const intervalMs = 15000 / REPLAY_SPEEDS[speedIndex];
		const maxIndex = trackPoints.length - 1;

		const interval = setInterval(() => {
			setProgress((prev) => {
				if (prev >= maxIndex) {
					setPlaying(false);
					return prev;
				}
				return prev + 1;
			});
		}, intervalMs);

		return () => clearInterval(interval);
	}, [playing, speedIndex, trackPoints.length]);

	if (!data || isLoading) {
		return <Spinner />;
	}

	return (
		<div className="fixed inset-0 bg-background">
			<ReplayMap />
			{/* <ReplayPanel pilot={data.pilot} trackPoints={trackPoints} index={progress} /> */}
			<footer className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center gap-2 py-1 px-2 rounded-xl outline border overflow-hidden backdrop-blur-md bg-linear-to-r from-white/1 from-20% via-white/3 via-50% to-white/1">
				<ReplayControls
					progress={progress}
					setProgress={setProgress}
					setSpeedIndex={setSpeedIndex}
					setPlaying={setPlaying}
					playing={playing}
					onDownload={() => downloadTrackpointsCSV(trackPoints, `${data.pilot.callsign}_${id}_track.csv`)}
					max={trackPoints.length - 1}
				/>
				<div className="flex items-center justify-center gap-4 text-xs">
					<div className="flex gap-1">
						<SnailIcon className="size-4" aria-hidden="true" />
						<span>{REPLAY_SPEEDS[speedIndex]} x</span>
					</div>
				</div>
			</footer>
		</div>
	);
}

function downloadTrackpointsCSV(trackPoints: Required<TrackPoint>[], filename = "trackpoints.csv") {
	if (!trackPoints.length) return;

	const headers = ["timestamp", "latitude", "longitude", "altitude_ms", "altitude_agl", "groundspeed", "vertical_speed", "heading"];
	const rows = trackPoints.map((p) => {
		const coordinates = toLonLat(p.coordinates);
		return [p.timestamp, coordinates[1], coordinates[0], p.altitude_ms, p.altitude_agl, p.groundspeed, p.vertical_speed, p.heading].join(",");
	});
	const csvContent = [headers.join(","), ...rows].join("\n");

	const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
	const url = URL.createObjectURL(blob);

	const link = document.createElement("a");
	link.href = url;
	link.setAttribute("download", filename);
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}
