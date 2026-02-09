import type { StaticAirline } from "@sr24/types/db";
import type { PilotLong } from "@sr24/types/interface";
import { useEffect, useState } from "react";
import { AvatarAirline } from "@/components/shared/Avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { MapService } from "@/lib/map/MapService";
import { getCachedAirline } from "@/storage/cache";

export function PilotHeader({
	pilot,
	mapService,
	minimized,
	setMinimized,
}: {
	pilot: PilotLong;
	mapService?: MapService;
	minimized: boolean;
	setMinimized: React.Dispatch<React.SetStateAction<boolean>>;
}) {
	const [airline, setAirline] = useState<StaticAirline | null>(null);

	useEffect(() => {
		const airlineCode = pilot.callsign.slice(0, 3).toUpperCase();
		getCachedAirline(airlineCode).then(setAirline);
	}, [pilot]);

	return (
		<div className="flex gap-2 items-center p-2">
			<AvatarAirline airline={airline} size="lg" />
			<div className="flex flex-col gap-1.5">
				<span className="text-lg font-bold leading-none">{pilot.callsign}</span>
				<div className="flex gap-1 text-xs text-muted-foreground leading-none">
					<span>{airline?.name}</span>
					<Separator orientation="vertical" className="bg-muted-foreground" />
					<span>{pilot.aircraft}</span>
				</div>
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
