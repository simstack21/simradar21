import type { FIRFeature, SimAwareTraconFeature, StaticAirport } from "@sr24/types/db";
import type { ControllerLong } from "@sr24/types/interface";
import { ChartNoAxesCombinedIcon, CheckIcon, CopyIcon, EyeIcon, EyeOffIcon, TowerControlIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { getOnlineTime } from "@/lib/helpers";
import { getControllerColor } from "@/lib/panels";

export default function ControllerInfo({
	controller,
	airport,
	sector,
}: {
	controller: ControllerLong;
	airport?: StaticAirport | null;
	sector?: SimAwareTraconFeature | FIRFeature | null;
}) {
	const [showAtis, setShowAtis] = useState(false);
	const [copied, setCopied] = useState(false);

	const atis = controller.atis?.join("\n") || "No ATIS information available.";

	const onCopyClick = () => {
		navigator.clipboard.writeText(atis);
		toast.success("ATIS Copied to Clipboard!");
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<Card size="sm" className="gap-2!">
			<CardHeader className="gap-0">
				<CardTitle className="flex">
					<span>{controller.callsign}</span>
					<Badge style={{ backgroundColor: `var(--${getControllerColor(controller.facility)})` }} className="ml-auto px-1.5">
						<TowerControlIcon />
						<span className="leading-none font-mono">{(controller.frequency / 1000).toFixed(3)}</span>
					</Badge>
				</CardTitle>
				<CardDescription>{getControllerName(controller.facility, sector, airport)}</CardDescription>
			</CardHeader>
			<CardContent className="relative grid grid-cols-2 gap-1">
				<div className="flex flex-col">
					<span className="text-muted-foreground">Connections</span>
					<span>{controller.connections}</span>
				</div>
				<div className="flex flex-col">
					<span className="text-muted-foreground">Time Online</span>
					<span>{getOnlineTime(controller.logon_time)}</span>
				</div>
				<div className="flex flex-col">
					<span className="text-muted-foreground">Name</span>
					<span>{controller.name}</span>
				</div>
				<div className="flex flex-col">
					<span className="text-muted-foreground">VATSIM ID</span>
					<span>{controller.cid}</span>
				</div>
				<div className="flex flex-col">
					<span className="text-muted-foreground">Server</span>
					<span>{controller.server}</span>
				</div>
				<div className="flex flex-col">
					<span className="text-muted-foreground">Controller Rating</span>
					<span>{controller.rating}</span>
				</div>
				{showAtis && (
					<div className="absolute inset-0 z-10 bg-muted">
						<ScrollArea className="max-h-full overflow-hidden flex flex-col px-3 py-2">
							<div>{atis}</div>
							<ScrollBar />
						</ScrollArea>
					</div>
				)}
			</CardContent>
			<CardFooter className="flex gap-2">
				<Button onClick={() => setShowAtis((prev) => !prev)} variant={showAtis ? "destructive" : "default"}>
					{showAtis ? <EyeOffIcon data-icon="inline-start" /> : <EyeIcon data-icon="inline-start" />}
					ATIS
				</Button>
				<Button onClick={onCopyClick} variant="outline">
					{copied ? <CheckIcon data-icon="inline-start" className="text-green" /> : <CopyIcon data-icon="inline-start" />}
					ATIS
				</Button>
				<a href={`https://stats.vatsim.net/stats/${controller.cid}`} target="_blank" className="text-inherit">
					<Button variant="outline">
						<ChartNoAxesCombinedIcon data-icon="inline-start" />
						Stats
					</Button>
				</a>
			</CardFooter>
		</Card>
	);
}

function getControllerName(facility: number, sector?: SimAwareTraconFeature | FIRFeature | null, airport?: StaticAirport | null): string {
	switch (facility) {
		case -1:
			return `${airport?.city || "Unknown Airport"} ATIS`;
		case 2:
			return `${airport?.city || "Unknown Airport"} Delivery`;
		case 3:
			return `${airport?.city || "Unknown Airport"} Ground`;
		case 4:
			return `${airport?.city || "Unknown Airport"} Tower`;
		case 5:
			return sector?.properties.name || "Unknown Approach";
		case 6:
			return sector?.properties.name || "Unknown Approach";
		default:
			return "UNKNOWN";
	}
}
