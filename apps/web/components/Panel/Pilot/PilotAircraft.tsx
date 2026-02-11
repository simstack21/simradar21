import type { StaticAircraft } from "@sr24/types/db";
import type { PilotLong } from "@sr24/types/interface";
import { ArrowRightIcon, PlaneIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { AvatarCountry } from "@/components/shared/Avatar";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { getCachedAircraft } from "@/storage/cache";

export function PilotAircraft({ pilot }: { pilot: PilotLong }) {
	const [aircraft, setAircraft] = useState<StaticAircraft | null>(null);

	useEffect(() => {
		const registration = pilot.flight_plan?.ac_reg;
		if (!registration) return;
		getCachedAircraft(registration).then(setAircraft);
	}, [pilot]);

	const acType = `${aircraft?.manufacturerName || ""} ${aircraft?.model || ""}`;

	return (
		<AccordionItem
			value="aircraft"
			className="overflow-hidden flex flex-col has-focus-visible:border-ring has-focus-visible:ring-ring/50 outline-none has-focus-visible:z-10 has-focus-visible:ring-[3px]"
		>
			<AccordionTrigger className="items-center data-panel-open:bg-muted">
				<div className="flex items-center gap-4">
					<PlaneIcon className="size-4 shrink-0" />
					<span>Aircraft</span>
				</div>
			</AccordionTrigger>
			<AccordionContent className="py-1 grid grid-cols-2 gap-1">
				{aircraft && (
					<div className="flex gap-2 items-center col-span-2">
						<AvatarCountry country={aircraft.country} size="sm" />
						<div className="flex flex-col">
							<span className="text-muted-foreground">Aircraft Type</span>
							<span>{acType.trim() ? acType : pilot.aircraft}</span>
						</div>
					</div>
				)}
				{!aircraft && (
					<div className="flex flex-col">
						<span className="text-muted-foreground">Aircraft Type</span>
						<span>{acType.trim() ? acType : pilot.aircraft}</span>
					</div>
				)}
				{!aircraft && pilot.flight_plan?.ac_reg && (
					<div className="flex flex-col">
						<span className="text-muted-foreground">Registration</span>
						<span>{pilot.flight_plan?.ac_reg}</span>
					</div>
				)}
				{aircraft && (
					<>
						<div className="flex flex-col col-span-2">
							<span className="text-muted-foreground">Owner</span>
							<span>{aircraft.owner || "N/A"}</span>
						</div>
						<div className="flex flex-col">
							<span className="text-muted-foreground">Registration</span>
							<span>{pilot.flight_plan?.ac_reg}</span>
						</div>
						<div className="flex flex-col">
							<span className="text-muted-foreground">Serial Number (MSN)</span>
							<span>{aircraft.serialNumber || "N/A"}</span>
						</div>
						<div className="flex flex-col">
							<span className="text-muted-foreground">ICAO24</span>
							<span>{aircraft.icao24 || "N/A"}</span>
						</div>
						<div className="flex flex-col">
							<span className="text-muted-foreground">SELCAL</span>
							<span>{aircraft.selCal || "N/A"}</span>
						</div>
						<a href={`/data/aircrafts/${pilot.flight_plan?.ac_reg}`} className="flex col-span-2 items-center group gap-1">
							View more flights of {pilot.flight_plan?.ac_reg}
							<ArrowRightIcon className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
						</a>
					</>
				)}
			</AccordionContent>
		</AccordionItem>
	);
}
