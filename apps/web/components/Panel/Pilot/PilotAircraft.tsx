import type { StaticAircraft } from "@sr24/types/db";
import type { PilotLong } from "@sr24/types/interface";
import { ArrowRightIcon, PlaneIcon } from "lucide-react";
import useSWR from "swr";
import { AvatarCountry } from "@/components/shared/Avatar";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { fetchApi } from "@/lib/api";

export function PilotAircraft({ pilot }: { pilot: PilotLong }) {
	const { data: aircraftData } = useSWR<StaticAircraft>(`/data/aircraft/${pilot.flight_plan?.ac_reg}`, fetchApi, {
		revalidateIfStale: false,
		revalidateOnFocus: false,
		revalidateOnReconnect: false,
		shouldRetryOnError: false,
	});

	const acType = `${aircraftData?.manufacturerName || ""} ${aircraftData?.model || ""}`;

	return (
		<AccordionItem value="aircraft" className="overflow-hidden flex flex-col">
			<AccordionTrigger className="items-center data-panel-open:bg-muted">
				<div className="flex items-center gap-4">
					<PlaneIcon className="size-4 shrink-0" />
					<span>Aircraft</span>
				</div>
			</AccordionTrigger>
			<AccordionContent className="py-1 grid grid-cols-2 gap-1">
				{aircraftData && (
					<div className="flex gap-2 items-center col-span-2">
						<AvatarCountry country={aircraftData.country} size="sm" />
						<div className="flex flex-col">
							<span className="text-muted-foreground">Aircraft Type</span>
							<span>{acType.trim() ? acType : pilot.aircraft}</span>
						</div>
					</div>
				)}
				{!aircraftData && (
					<div className="flex flex-col">
						<span className="text-muted-foreground">Aircraft Type</span>
						<span>{acType.trim() ? acType : pilot.aircraft}</span>
					</div>
				)}
				{!aircraftData && pilot.flight_plan?.ac_reg && (
					<div className="flex flex-col">
						<span className="text-muted-foreground">Registration</span>
						<span>{pilot.flight_plan?.ac_reg}</span>
					</div>
				)}
				{aircraftData && (
					<>
						<div className="flex flex-col col-span-2">
							<span className="text-muted-foreground">Owner</span>
							<span>{aircraftData.owner || "N/A"}</span>
						</div>
						<div className="flex flex-col">
							<span className="text-muted-foreground">Registration</span>
							<span>{pilot.flight_plan?.ac_reg}</span>
						</div>
						<div className="flex flex-col">
							<span className="text-muted-foreground">Serial Number (MSN)</span>
							<span>{aircraftData.serialNumber || "N/A"}</span>
						</div>
						<div className="flex flex-col">
							<span className="text-muted-foreground">ICAO24</span>
							<span>{aircraftData.icao24 || "N/A"}</span>
						</div>
						<div className="flex flex-col">
							<span className="text-muted-foreground">SELCAL</span>
							<span>{aircraftData.selCal || "N/A"}</span>
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
