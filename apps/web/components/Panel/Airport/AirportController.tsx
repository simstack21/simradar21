import type { StaticAirport } from "@sr24/types/db";
import type { ControllerLong } from "@sr24/types/interface";
import { TowerControlIcon } from "lucide-react";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { fetchApi } from "@/lib/api";
import { getCachedAirport } from "@/storage/cache";
import ControllerInfo from "../shared/ControllerInfo";

export default function AirportController({ icao }: { icao: string }) {
	const { data: controllers } = useSWR<ControllerLong[]>(`/map/controller/airport/${icao}`, fetchApi, {
		refreshInterval: 60_000,
		shouldRetryOnError: false,
	});
	const [airport, setAirport] = useState<StaticAirport | null>(null);

	useEffect(() => {
		getCachedAirport(icao).then(setAirport);
	}, [icao]);

	if (!airport || !controllers || controllers.length === 0) return null;

	const sortedControllers = controllers?.sort((a, b) => b.facility - a.facility);

	return (
		<AccordionItem value="controller" className="overflow-hidden flex flex-col">
			<AccordionTrigger className="items-center data-panel-open:bg-muted">
				<div className="flex items-center gap-4">
					<TowerControlIcon className="size-4 shrink-0" />
					<span>Active Controllers</span>
				</div>
			</AccordionTrigger>
			<AccordionContent className="py-2 flex flex-col gap-2">
				{sortedControllers.map((c) => (
					<ControllerInfo key={c.cid} controller={c} airport={airport} />
				))}
			</AccordionContent>
		</AccordionItem>
	);
}
