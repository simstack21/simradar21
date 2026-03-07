import useMediaQuery from "@mui/material/useMediaQuery";
import type { PilotLong, TrackPoint } from "@sr24/types/interface";
import { usePathname, useRouter } from "next/navigation";
import LoadingPanel from "@/components/Panel/Loading";
import NotFoundPanel from "@/components/Panel/NotFound";
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
import { useMinimizedPanelsStore, usePilotPanelStore } from "@/storage/zustand";
import { mapService } from "../../lib";

export default function ReplayPanel({
	pilot,
	isLoading,
	trackPoints,
	index,
}: {
	pilot: PilotLong | undefined;
	isLoading: boolean;
	trackPoints: Required<TrackPoint>[];
	index: number;
}) {
	const { minimized, setMinimized } = useMinimizedPanelsStore();
	const isMobile = useMediaQuery("(max-width: 1024px)");
	const { panel, setPanel } = usePilotPanelStore();
	const router = useRouter();
	const pathname = usePathname();

	const onClose = () => {
		const segments = pathname.split("/").filter(Boolean);
		segments.pop();
		router.push(`/${segments.join("/")}`);
	};

	if (isLoading)
		return (
			<PanelGrid>
				<LoadingPanel />
			</PanelGrid>
		);
	if (!pilot)
		return (
			<PanelGrid>
				<NotFoundPanel
					title="Pilot not found"
					description="This pilot does not exist or is currently unavailable, most likely because of an incorrect ID or disconnect."
					onClick={onClose}
				/>
			</PanelGrid>
		);

	return (
		<PanelGrid>
			<div className="max-h-full glass-panel rounded-md pointer-events-auto overflow-hidden flex flex-col">
				<PilotHeader pilot={pilot} onClose={onClose} minimized={minimized} setMinimized={setMinimized} />
				{!minimized && (
					<>
						<PilotRoute pilot={pilot} trackPoint={trackPoints[index]} />
						<ScrollArea className="max-h-full overflow-hidden flex flex-col">
							<Accordion multiple={!isMobile} className="rounded-none border-none" value={panel} onValueChange={setPanel}>
								<PilotFlightplan pilot={pilot} />
								<PilotAircraft pilot={pilot} />
								<PilotChart trackPoints={trackPoints} />
								<PilotTelemetry pilot={pilot} trackPoint={trackPoints[index]} />
								<PilotUser pilot={pilot} />
								<PilotMisc pilot={pilot} trackPoint={trackPoints[index]} />
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
