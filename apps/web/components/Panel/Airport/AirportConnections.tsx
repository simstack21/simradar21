import type { AirportLong } from "@sr24/types/interface";
import { ArrowDownRightIcon, ArrowDownUpIcon, ArrowUpRightIcon } from "lucide-react";
import useSWR from "swr";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { fetchApi } from "@/lib/api";
import { getDelayColorFromNumber } from "@/lib/panels";

export default function AirportConnections({ icao, size }: { icao: string; size?: "default" | "sm" }) {
	const { data: airportData } = useSWR<AirportLong>(`/map/airport/${icao}`, fetchApi, {
		refreshInterval: 60_000,
		shouldRetryOnError: false,
	});

	if (!airportData) return null;

	if (size === "sm") {
		return (
			<div className="flex flex-col gap-1 text-xs">
				<div className="flex items-center gap-1">
					<ArrowUpRightIcon size={16} />
					<span>{airportData.dep_traffic.traffic_count}</span>
					<Badge variant="outline">
						<span
							style={{ backgroundColor: `var(--${getDelayColorFromNumber(airportData.dep_traffic.average_delay)})` }}
							className="size-1.5 rounded-full"
							aria-hidden="true"
						/>
						{airportData.dep_traffic.average_delay} min
					</Badge>
				</div>
				<div className="flex items-center gap-1">
					<ArrowDownRightIcon size={16} />
					<span>{airportData.arr_traffic.traffic_count}</span>
					<Badge variant="outline">
						<span className={`bg-${getDelayColorFromNumber(airportData.arr_traffic.average_delay)} size-1.5 rounded-full`} aria-hidden="true" />
						{airportData.arr_traffic.average_delay} min
					</Badge>
				</div>
			</div>
		);
	}

	return (
		<AccordionItem value="connections" className="overflow-hidden flex flex-col">
			<AccordionTrigger className="items-center data-panel-open:bg-muted">
				<div className="flex items-center gap-4">
					<ArrowDownUpIcon className="size-4 shrink-0" />
					<span>Connections and Traffic</span>
				</div>
			</AccordionTrigger>
			<AccordionContent className="py-1 grid grid-cols-2 gap-1">
				<div className="flex col-span-2 gap-2 items-center">
					<span>Departures</span>
					<Badge variant="outline">
						<span
							style={{ backgroundColor: `var(--${getDelayColorFromNumber(airportData.dep_traffic.average_delay)})` }}
							className="size-1.5 rounded-full"
							aria-hidden="true"
						/>
						{airportData.dep_traffic.average_delay} min
					</Badge>
				</div>
				<div className="flex flex-col">
					<span className="text-muted-foreground">Total</span>
					<span>{airportData.dep_traffic.traffic_count}</span>
				</div>
				<div className="flex flex-col">
					<span className="text-muted-foreground">Unique Connections</span>
					<span>{airportData.unique.departures}</span>
				</div>
				<div className="flex flex-col">
					<span className="text-muted-foreground">Delayed</span>
					<span>{airportData.dep_traffic.flights_delayed}</span>
				</div>
				<div className="flex flex-col">
					<span className="text-muted-foreground">Busiest Route</span>
					<span>
						{airportData.busiest.departure[0]} - {airportData.busiest.departure[1]}
					</span>
				</div>
				<div className="flex col-span-2 gap-2 items-center">
					<span>Arrivals</span>
					<Badge variant="outline">
						<span className={`bg-${getDelayColorFromNumber(airportData.arr_traffic.average_delay)} size-1.5 rounded-full`} aria-hidden="true" />
						{airportData.arr_traffic.average_delay} min
					</Badge>
				</div>
				<div className="flex flex-col">
					<span className="text-muted-foreground">Total</span>
					<span>{airportData.arr_traffic.traffic_count}</span>
				</div>
				<div className="flex flex-col">
					<span className="text-muted-foreground">Unique Connections</span>
					<span>{airportData.unique.arrivals}</span>
				</div>
				<div className="flex flex-col">
					<span className="text-muted-foreground">Delayed</span>
					<span>{airportData.arr_traffic.flights_delayed}</span>
				</div>
				<div className="flex flex-col">
					<span className="text-muted-foreground">Busiest Route</span>
					<span>
						{airportData.busiest.arrival[0]} - {airportData.busiest.arrival[1]}
					</span>
				</div>
			</AccordionContent>
		</AccordionItem>
	);
}
