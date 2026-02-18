"use client";

import type { DeltaTrackPoint, TrackPoint } from "@sr24/types/interface";
import { CheckIcon, EyeIcon, EyeOffIcon, ShareIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { fetchApi } from "@/lib/api";
import type { MapService } from "@/lib/map/MapService";
import { decodeTrackPoints } from "@/lib/map/tracks";

type ArrivalTrackPoints = {
	id: string;
	track: (TrackPoint | DeltaTrackPoint)[];
};

export function AirportFooter({ icao, mapService }: { icao: string; mapService?: MapService }) {
	const [shared, setShared] = useState(false);
	const [showTracks, setShowTracks] = useState(false);
	const [loading, setLoading] = useState(false);

	const onShareClick = () => {
		navigator.clipboard.writeText(`${window.location.origin}/airport/${icao}`);
		toast.success("Link Copied to Clipboard!");
		setShared(true);
		setTimeout(() => setShared(false), 2000);
	};

	const onToggleTracks = async () => {
		if (!mapService) return;
		if (showTracks) {
			resetTracks(mapService);
			setShowTracks(false);
		} else {
			setLoading(true);
			await fetchTracks(icao, mapService);
			setLoading(false);
			setShowTracks(true);
		}
	};

	useEffect(() => {
		if (!mapService) return;
		return () => {
			resetTracks(mapService);
		};
	}, [mapService]);

	return (
		<div className="flex gap-2 items-center justify-between p-2">
			{mapService && (
				<Button variant={showTracks ? "destructive" : "default"} onClick={onToggleTracks}>
					{loading ? <Spinner /> : showTracks ? <EyeOffIcon data-icon="inline-start" /> : <EyeIcon data-icon="inline-start" />}
					Arriving Tracks
				</Button>
			)}
			<Button variant="outline" onClick={onShareClick} className={mapService ? "" : "w-full"}>
				{shared ? <CheckIcon className="text-green" /> : <ShareIcon />}
			</Button>
		</div>
	);
}

function resetTracks(mapService: MapService) {
	mapService.clearMap();
	mapService.unfocusFeatures();
	mapService.setView({ minimalOverlays: false });
}

async function fetchTracks(icao: string, mapService: MapService) {
	const masked = await fetchApi<ArrivalTrackPoints[]>(`/map/airport/${icao}/arriving-tracks`);

	mapService.setView({ minimalOverlays: true });

	const newIds: string[] = [];
	for (const { id, track } of masked) {
		const trackPoints = decodeTrackPoints(track);
		mapService.setFeatures({ trackPoints, autoTrackId: id });
		newIds.push(id);
	}

	mapService.focusFeatures({ pilots: newIds, airports: [icao], hideLayers: ["controller"] });
}
