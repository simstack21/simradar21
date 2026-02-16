import useMediaQuery from "@mui/material/useMediaQuery";
import type { PilotLong, TrackPoint } from "@sr24/types/interface";
import { useState } from "react";
import { PanelGrid } from "@/components/Panel/PanelGrid";
import { PilotAircraft } from "@/components/Panel/Pilot/PilotAircraft";
import { PilotChart } from "@/components/Panel/Pilot/PilotChart";
import { PilotFlightplan } from "@/components/Panel/Pilot/PilotFlightplan";
import { PilotFooter } from "@/components/Panel/Pilot/PilotFooter";
import { PilotHeader } from "@/components/Panel/Pilot/PilotHeader";
import { PilotMisc } from "@/components/Panel/Pilot/PilotMisc";
import PilotRoute from "@/components/Panel/Pilot/PilotRoute";
import { PilotTelemetry } from "@/components/Panel/Pilot/PilotTelemetry";
import { PilotUser } from "@/components/Panel/Pilot/PilotUser";
import { Accordion } from "@/components/ui/accordion";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { usePilotPanelStore } from "@/storage/zustand";
import { mapService } from "../../lib";

export default function ReplayPanel({ pilot, trackPoints, index }: { pilot: PilotLong; trackPoints: Required<TrackPoint>[]; index: number }) {
	const [minimized, setMinimized] = useState(false);
	const isMobile = useMediaQuery("(max-width: 1024px)");
	const { panel, setPanel } = usePilotPanelStore();

	return (
		<PanelGrid>
			<div className="max-h-full glass-panel rounded-md pointer-events-auto overflow-hidden flex flex-col">
				<PilotHeader pilot={pilot} minimized={minimized} setMinimized={setMinimized} />
				{!minimized && (
					<>
						<PilotRoute pilot={pilot} />
						<ScrollArea className="max-h-full overflow-hidden flex flex-col">
							<Accordion multiple={!isMobile} className="rounded-none border-none" value={panel} onValueChange={setPanel}>
								<PilotFlightplan pilot={pilot} />
								<PilotAircraft pilot={pilot} />
								<PilotChart trackPoints={trackPoints} />
								<PilotTelemetry pilot={pilot} trackPoint={trackPoints[index]} />
								<PilotUser pilot={pilot} />
								<PilotMisc pilot={pilot} />
							</Accordion>
							<ScrollBar />
						</ScrollArea>
					</>
				)}
				<PilotFooter pilot={pilot} mapService={mapService} />
			</div>
		</PanelGrid>
	);
}
