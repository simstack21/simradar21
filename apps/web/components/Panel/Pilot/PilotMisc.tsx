import type { PilotLong, TrackPoint } from "@sr24/types/interface";
import { RadioIcon } from "lucide-react";
import type { Coordinate } from "ol/coordinate";
import { toLonLat } from "ol/proj";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function PilotMisc({ pilot, trackPoint }: { pilot: PilotLong; trackPoint?: TrackPoint }) {
	const coordinates: Coordinate = trackPoint ? toLonLat(trackPoint.coordinates) : [pilot.latitude, pilot.longitude];

	return (
		<AccordionItem value="misc" className="overflow-hidden flex flex-col">
			<AccordionTrigger className="items-center data-panel-open:bg-muted">
				<div className="flex items-center gap-4">
					<RadioIcon className="size-4 shrink-0" />
					<span>Miscellaneous</span>
				</div>
			</AccordionTrigger>
			<AccordionContent className="py-1 grid grid-cols-2 gap-1">
				<div className="flex flex-col">
					<span className="text-muted-foreground">Server</span>
					<span>{pilot.server}</span>
				</div>
				<div className="flex flex-col">
					<span className="text-muted-foreground">Transponder</span>
					<span>{pilot.transponder}</span>
				</div>
				<div className="flex flex-col">
					<span className="text-muted-foreground">Latitude</span>
					<span>{coordinates[1].toFixed(6)}</span>
				</div>
				<div className="flex flex-col">
					<span className="text-muted-foreground">Longitude</span>
					<span>{coordinates[0].toFixed(6)}</span>
				</div>
			</AccordionContent>
		</AccordionItem>
	);
}
