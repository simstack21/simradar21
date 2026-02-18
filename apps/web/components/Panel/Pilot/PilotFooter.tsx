"use client";

import type { PilotLong } from "@sr24/types/interface";
import { ChartNoAxesCombinedIcon, CheckIcon, EyeIcon, EyeOffIcon, RouteIcon, RouteOffIcon, ShareIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { MapService } from "@/lib/map/MapService";

type MapInteraction = "route" | "follow" | null;

export function PilotFooter({ pilot, mapService }: { pilot: PilotLong; mapService?: MapService }) {
	const [mapInteraction, setMapInteraction] = useState<MapInteraction>(null);
	const [shared, setShared] = useState(false);

	const resetInteraction = () => {
		mapService?.unfollowPilot();
		mapService?.unfocusFeatures();
		mapService?.fitFeatures();
	};

	const onShareClick = () => {
		navigator.clipboard.writeText(window.location.href);
		toast.success("Link Copied to Clipboard!");
		setShared(true);
		setTimeout(() => setShared(false), 2000);
	};

	return (
		<div className="flex gap-2 items-center p-2">
			{mapService && (
				<>
					<Button
						variant={mapInteraction === "route" ? "destructive" : "default"}
						onClick={() =>
							setMapInteraction((prev) => {
								resetInteraction();
								if (prev === "route") return null;

								mapService.focusFeatures({
									airports: [pilot.flight_plan?.departure.icao || "", pilot.flight_plan?.arrival.icao || ""],
									pilots: [pilot.id],
									hideLayers: ["controller"],
								});
								mapService.fitFeatures({ airports: [pilot.flight_plan?.departure.icao || "", pilot.flight_plan?.arrival.icao || ""] });

								return "route";
							})
						}
					>
						{mapInteraction === "route" ? <RouteOffIcon data-icon="inline-start" /> : <RouteIcon data-icon="inline-start" />}
						Route
					</Button>
					<Button
						variant={mapInteraction === "follow" ? "destructive" : "default"}
						onClick={() =>
							setMapInteraction((prev) => {
								resetInteraction();
								if (prev === "follow") return null;

								mapService.fitFeatures();
								mapService.followPilot();

								return "follow";
							})
						}
					>
						{mapInteraction === "follow" ? <EyeOffIcon data-icon="inline-start" /> : <EyeIcon data-icon="inline-start" />}
						Follow
					</Button>
				</>
			)}
			<a href={`https://stats.vatsim.net/stats/${pilot.cid}`} target="_blank" className="text-inherit ml-auto">
				<Button variant="outline">
					<ChartNoAxesCombinedIcon data-icon="inline-start" />
					Stats
				</Button>
			</a>
			<Button variant="outline" onClick={onShareClick}>
				{shared ? <CheckIcon className="text-green" /> : <ShareIcon />}
			</Button>
		</div>
	);
}
