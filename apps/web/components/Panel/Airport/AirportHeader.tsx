import type { StaticAirport } from "@sr24/types/db";
import { useEffect, useState } from "react";
import { AvatarCountry } from "@/components/shared/Avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { MapService } from "@/lib/map/MapService";
import { getCachedAirport } from "@/storage/cache";

export function AirportHeader({
	icao,
	mapService,
	minimized,
	setMinimized,
}: {
	icao: string;
	mapService?: MapService;
	minimized: boolean;
	setMinimized: React.Dispatch<React.SetStateAction<boolean>>;
}) {
	const [airport, setAirport] = useState<StaticAirport | null>(null);

	useEffect(() => {
		getCachedAirport(icao).then(setAirport);
	}, [icao]);

	return (
		<div className="flex gap-2 items-center p-2">
			<AvatarCountry country={airport?.country || ""} size="lg" />
			<div className="flex flex-col gap-1.5">
				<span className="text-lg font-bold leading-none">{airport?.id || "N/A"}</span>
				<div className="flex gap-1 text-xs text-muted-foreground leading-none">
					<span>{airport?.name || "Unknown"}</span>
					<Separator orientation="vertical" className="bg-muted-foreground" />
					<span>{airport?.iata || "N/A"}</span>
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
