import { RadioTowerIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getControllerColor, getSectorFeature } from "@/lib/panels";
import { cn } from "@/lib/utils";
import type { SectorPanelData } from "@/types/panels";

export function SectorHeader({
	size,
	callsign,
	onClose,
	minimized,
	setMinimized,
}: {
	size?: "default" | "sm";
	callsign: string;
	onClose?: () => void;
	minimized?: boolean;
	setMinimized?: (value: boolean) => void;
}) {
	const [sector, setSector] = useState<SectorPanelData | null>(null);

	useEffect(() => {
		getSectorFeature(callsign).then(setSector);
	}, [callsign]);

	if (!sector) return null;

	return (
		<div className={cn("flex gap-2 items-center", size === "sm" ? "px-1.5 py-1" : "p-2")}>
			<span
				className={cn("text-white rounded-full flex justify-center items-center shrink-0", size === "sm" ? "h-8 w-8" : "h-10 w-10")}
				style={{ backgroundColor: getControllerColor(sector.type === "fir" ? 6 : 5) }}
			>
				<RadioTowerIcon className={size === "sm" ? "h-4 w-4" : "h-5 w-5"} />
			</span>
			<div className={cn("flex flex-col overflow-hidden mr-auto", size === "default" && "gap-1")}>
				<span className={cn("font-bold", size === "sm" ? "text-sm" : "text-lg leading-none")}>{callsign}</span>
				<span className="text-xs text-muted-foreground overflow-hidden whitespace-nowrap text-ellipsis">
					{sector.type?.toUpperCase() || "Unknown Type"} | {sector.feature?.properties.name || "Unknown Sector"}
				</span>
			</div>
			{setMinimized && (
				<Button variant="outline" onClick={() => setMinimized(!minimized)}>
					{minimized ? "Show" : "Hide"}
				</Button>
			)}
			{onClose && (
				<Button variant="destructive" onClick={onClose}>
					Close
				</Button>
			)}
		</div>
	);
}
