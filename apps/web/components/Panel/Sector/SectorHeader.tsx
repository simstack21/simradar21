import { RadioTowerIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { MapService } from "@/lib/map/MapService";
import { getSectorFeature } from "@/lib/panels";
import type { SectorPanelData } from "@/types/panels";

export function SectorHeader({
	callsign,
	mapService,
	minimized,
	setMinimized,
}: {
	callsign: string;
	mapService?: MapService;
	minimized: boolean;
	setMinimized: React.Dispatch<React.SetStateAction<boolean>>;
}) {
	const [sector, setSector] = useState<SectorPanelData | null>(null);

	useEffect(() => {
		getSectorFeature(callsign).then(setSector);
	}, [callsign]);

	if (!sector) return null;

	return (
		<div className="flex gap-2 items-center p-2">
			<span
				className={`h-10 w-10 text-muted rounded-full flex justify-center items-center shrink-0 ${sector.type === "fir" ? "bg-grey" : "bg-magenta"}`}
			>
				<RadioTowerIcon className="h-5 w-5" />
			</span>
			<div className="flex flex-col gap-1 overflow-hidden">
				<span className="text-lg font-bold leading-none">{callsign}</span>
				<span className="text-xs text-muted-foreground overflow-hidden whitespace-nowrap text-ellipsis">
					{sector.type?.toUpperCase() || "Unknown Type"} | {sector.feature?.properties.name || "Unknown Sector"}
				</span>
			</div>
			<Button variant="outline" onClick={() => setMinimized((prev) => !prev)} className="ml-auto">
				{minimized ? "Show" : "Hide"}
			</Button>
			{mapService && (
				<Button variant="destructive" onClick={() => mapService.resetMap()}>
					Close
				</Button>
			)}
		</div>
	);
}
