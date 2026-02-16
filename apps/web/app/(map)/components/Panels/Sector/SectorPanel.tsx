"use client";

import useMediaQuery from "@mui/material/useMediaQuery";
import type { ControllerLong } from "@sr24/types/interface";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { mapService } from "@/app/(map)/lib";
import LoadingPanel from "@/components/Panel/Loading";
import NotFoundPanel from "@/components/Panel/NotFound";
import { MotionPanel } from "@/components/Panel/PanelGrid";
import SectorController from "@/components/Panel/Sector/SectorController";
import { SectorFooter } from "@/components/Panel/Sector/SectorFooter";
import { SectorHeader } from "@/components/Panel/Sector/SectorHeader";
import { Accordion } from "@/components/ui/accordion";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { fetchApi } from "@/lib/api";
import { getSectorFeature } from "@/lib/panels";
import { useSectorPanelStore } from "@/storage/zustand";
import type { SectorPanelData } from "@/types/panels";

export default function SectorPanel({ callsign }: { callsign: string }) {
	const { isLoading } = useSWR<ControllerLong[]>(`/map/controller/sector/${callsign}`, fetchApi, {
		refreshInterval: 60_000,
		shouldRetryOnError: false,
	});

	const { panel, setPanel } = useSectorPanelStore();
	const [minimized, setMinimized] = useState(false);
	const isMobile = useMediaQuery("(max-width: 1024px)");

	const [sector, setSector] = useState<SectorPanelData | null | undefined>();

	useEffect(() => {
		getSectorFeature(callsign).then(setSector);
	}, [callsign]);

	if (isLoading || sector === undefined) return <LoadingPanel />;
	if (!sector) return <NotFoundPanel title="Sector not found" description="This sector does not exist." onClick={() => mapService.resetMap()} />;

	return (
		<MotionPanel className="max-h-full glass-panel rounded-md pointer-events-auto overflow-hidden flex flex-col">
			<SectorHeader callsign={callsign} onClose={() => mapService.resetMap()} minimized={minimized} setMinimized={setMinimized} />
			{!minimized && (
				<ScrollArea className="max-h-full overflow-hidden flex flex-col">
					<Accordion multiple={!isMobile} className="rounded-none border-none" value={panel} onValueChange={setPanel}>
						<SectorController callsign={callsign} />
					</Accordion>
					<ScrollBar />
				</ScrollArea>
			)}
			<SectorFooter callsign={callsign} />
		</MotionPanel>
	);
}
