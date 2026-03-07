import type { StaticAirport } from "@sr24/types/db";
import { useEffect, useState } from "react";
import { AvatarCountry } from "@/components/shared/Avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getCachedAirport } from "@/storage/cache";

export function AirportHeader({
	size = "default",
	icao,
	onClose,
	minimized,
	setMinimized,
}: {
	size?: "default" | "sm";
	icao: string;
	onClose?: () => void;
	minimized: boolean;
	setMinimized: (value: boolean) => void;
}) {
	const [airport, setAirport] = useState<StaticAirport | null>(null);

	useEffect(() => {
		getCachedAirport(icao).then(setAirport);
	}, [icao]);

	return (
		<div className={cn("flex gap-2 items-center", size === "sm" ? "px-1.5 py-1" : "p-2")}>
			<AvatarCountry country={airport?.country || ""} size={size === "sm" ? "default" : "lg"} />
			<div className={cn("flex flex-col overflow-hidden", size === "default" && "gap-1")}>
				<span className={cn("font-bold", size === "sm" ? "text-sm" : "text-lg leading-none")}>{icao}</span>
				<span className="text-xs text-muted-foreground overflow-hidden whitespace-nowrap text-ellipsis">
					{airport?.iata || "N/A"} | {airport?.name || "Unknown"}
				</span>
			</div>
			<Button variant="outline" onClick={() => setMinimized(!minimized)} className="ml-auto">
				{minimized ? "Show" : "Hide"}
			</Button>
			{onClose && (
				<Button variant="destructive" onClick={onClose}>
					Close
				</Button>
			)}
		</div>
	);
}
