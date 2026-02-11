import type { ControllerLong } from "@sr24/types/interface";
import { TowerControlIcon } from "lucide-react";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { fetchApi } from "@/lib/api";
import { getSectorFeature } from "@/lib/panels";
import type { SectorPanelData } from "@/types/panels";
import ControllerInfo from "../shared/ControllerInfo";

export default function SectorController({ callsign }: { callsign: string }) {
	const { data: controllers } = useSWR<ControllerLong[]>(`/map/controller/sector/${callsign}`, fetchApi, {
		refreshInterval: 60_000,
		shouldRetryOnError: false,
	});

	const [sector, setSector] = useState<SectorPanelData | null>(null);

	useEffect(() => {
		getSectorFeature(callsign).then(setSector);
	}, [callsign]);

	if (!sector || !controllers || controllers.length === 0) return null;

	const sortedControllers = controllers?.sort((a, b) => b.facility - a.facility);

	return (
		<AccordionItem
			value="controller"
			className="overflow-hidden flex flex-col has-focus-visible:border-ring has-focus-visible:ring-ring/50 outline-none has-focus-visible:z-10 has-focus-visible:ring-[3px]"
		>
			<AccordionTrigger className="items-center data-panel-open:bg-muted">
				<div className="flex items-center gap-4">
					<TowerControlIcon className="size-4 shrink-0" />
					<span>Active Controllers</span>
				</div>
			</AccordionTrigger>
			<AccordionContent className="py-2 flex flex-col gap-2">
				{sortedControllers.map((c) => (
					<ControllerInfo key={c.cid} controller={c} sector={sector.feature} />
				))}
			</AccordionContent>
		</AccordionItem>
	);
}
