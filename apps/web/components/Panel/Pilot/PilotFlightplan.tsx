import type { StaticAirport } from "@sr24/types/db";
import type { PilotLong } from "@sr24/types/interface";
import { ArrowRightIcon, FileTextIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { convertDistance, haversineDistance } from "@/lib/helpers";
import { getCachedAirport } from "@/storage/cache";
import { useSettingsStore } from "@/storage/zustand";

export function PilotFlightplan({ pilot }: { pilot: PilotLong }) {
	const { distanceUnit } = useSettingsStore();
	const [airports, setAirports] = useState<{ departure: StaticAirport | null; arrival: StaticAirport | null }>({ departure: null, arrival: null });

	useEffect(() => {
		if (!pilot.flight_plan) return;
		Promise.all([getCachedAirport(pilot.flight_plan.departure.icao), getCachedAirport(pilot.flight_plan.arrival.icao)]).then(
			([departure, arrival]) => {
				setAirports({ departure, arrival });
			},
		);
	}, [pilot]);

	const [distKm, enrouteTime] = getEnrouteValues(pilot, airports.departure, airports.arrival);

	return (
		<AccordionItem
			value="flightplan"
			className="overflow-hidden flex flex-col has-focus-visible:border-ring has-focus-visible:ring-ring/50 outline-none has-focus-visible:z-10 has-focus-visible:ring-[3px]"
		>
			<AccordionTrigger className="items-center data-panel-open:bg-muted">
				<div className="flex items-center gap-4">
					<FileTextIcon className="size-4 shrink-0" />
					<span>Flightplan</span>
				</div>
			</AccordionTrigger>
			<AccordionContent className="py-1 grid grid-cols-2 gap-1">
				<div className="flex flex-col">
					<span className="text-muted-foreground">Great circle distance</span>
					<span>{distKm !== null ? `${convertDistance(distKm, distanceUnit)}` : "N/A"}</span>
				</div>
				<div className="flex flex-col">
					<span className="text-muted-foreground">Enroute time</span>
					<span>{enrouteTime}</span>
				</div>
				<div className="flex flex-col col-span-2">
					<span className="text-muted-foreground">Flight Plan</span>
					<span>{pilot.flight_plan?.route || "No flight Plan Filed"}</span>
				</div>
				<div className="flex flex-col col-span-2">
					<span className="text-muted-foreground">Remarks</span>
					<span>{pilot.flight_plan?.remarks || "N/A"}</span>
				</div>
				<div className="flex flex-col col-span-2">
					<span className="text-muted-foreground">Flight Rules</span>
					<span>{pilot.flight_plan?.flight_rules || "N/A"}</span>
				</div>
				<a href={`/data/flights/${pilot.callsign}`} className="flex col-span-2 items-center group gap-1">
					View more flights for {pilot.callsign}
					<ArrowRightIcon className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
				</a>
			</AccordionContent>
		</AccordionItem>
	);
}

function getEnrouteValues(pilot: PilotLong, departure: StaticAirport | null, arrival: StaticAirport | null): [number, string] {
	const distKm = departure && arrival ? haversineDistance([departure.latitude, departure.longitude], [arrival.latitude, arrival.longitude]) : 0;
	if (!pilot.flight_plan?.enroute_time) return [distKm, "N/A"];

	const totalMinutes = Math.floor(pilot.flight_plan.enroute_time / 60);
	const hours = Math.floor(totalMinutes / 60);
	const minutes = totalMinutes % 60;

	return [distKm, `${hours}h ${minutes}m`];
}
