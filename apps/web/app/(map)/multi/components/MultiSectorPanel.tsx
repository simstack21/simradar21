import type { ControllerLong } from "@sr24/types/interface";
import { useEffect, useState } from "react";
import useSWR from "swr";
import LoadingPanel from "@/components/Panel/Loading";
import NotFoundPanel from "@/components/Panel/NotFound";
import { SectorHeader } from "@/components/Panel/Sector/SectorHeader";
import { fetchApi } from "@/lib/api";
import { getSectorFeature } from "@/lib/panels";
import type { SectorPanelData } from "@/types/panels";

export default function MultiSectorPanel({ callsign, removeSelected }: { callsign: string; removeSelected: (id: string) => void }) {
	const { isLoading } = useSWR<ControllerLong[]>(`/map/controller/sector/${callsign}`, fetchApi, {
		refreshInterval: 60_000,
		shouldRetryOnError: false,
	});

	const [sector, setSector] = useState<SectorPanelData | null | undefined>();

	useEffect(() => {
		getSectorFeature(callsign).then(setSector);
	}, [callsign]);

	if (isLoading || sector === undefined) return <LoadingPanel />;
	if (!sector)
		return <NotFoundPanel title="Sector not found" description="This sector does not exist." onClick={() => removeSelected(`sector_${callsign}`)} />;

	return (
		<div className="max-h-full glass-panel rounded-md pointer-events-auto overflow-hidden flex flex-col">
			<SectorHeader size="sm" callsign={callsign} onClose={() => removeSelected(`sector_${callsign}`)} />
		</div>
	);
}
