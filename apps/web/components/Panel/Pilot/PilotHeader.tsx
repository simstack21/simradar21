import type { StaticAirline } from "@sr24/types/db";
import type { PilotLong } from "@sr24/types/interface";
import { useEffect, useState } from "react";
import { AvatarAirline } from "@/components/shared/Avatar";
import { BadgePilotStatus } from "@/components/shared/Badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getCachedAirline } from "@/storage/cache";

export function PilotHeader({
	size = "default",
	pilot,
	onClose,
	minimized,
	setMinimized,
}: {
	size?: "default" | "sm";
	pilot: PilotLong;
	onClose?: () => void;
	minimized: boolean;
	setMinimized: (value: boolean) => void;
}) {
	const [airline, setAirline] = useState<StaticAirline | null>(null);

	useEffect(() => {
		const airlineCode = pilot.callsign.slice(0, 3).toUpperCase();
		getCachedAirline(airlineCode).then(setAirline);
	}, [pilot]);

	return (
		<div className={cn("flex gap-2 items-center", size === "sm" ? "px-1.5 py-1" : "p-2")}>
			<AvatarAirline airline={airline} size={size === "sm" ? "default" : "lg"} />
			<div className={cn("flex flex-col overflow-hidden", size === "default" && "gap-1")}>
				<div className={cn("flex items-center", size === "sm" ? "gap-1" : "gap-2")}>
					<span className={cn("font-bold", size === "sm" ? "text-sm" : "text-lg leading-none")}>{pilot.callsign}</span>
					<BadgePilotStatus status={pilot.live} />
				</div>
				<span className="text-xs text-muted-foreground overflow-hidden whitespace-nowrap text-ellipsis">
					{pilot.aircraft} | {airline?.name || "Unknown Airline"}
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
