import type { StaticAirport } from "@sr24/types/db";
import type { AirportLong } from "@sr24/types/interface";
import { useEffect, useState } from "react";
import useSWR from "swr";
import AirportConnections from "@/components/Panel/Airport/AirportConnections";
import { AirportHeader } from "@/components/Panel/Airport/AirportHeader";
import { AirportStatus } from "@/components/Panel/Airport/AirportStatus";
import LoadingPanel from "@/components/Panel/Loading";
import NotFoundPanel from "@/components/Panel/NotFound";
import { fetchApi } from "@/lib/api";
import { getCachedAirport } from "@/storage/cache";

export default function MultiAirportPanel({ icao, removeSelected }: { icao: string; removeSelected: (id: string) => void }) {
	const { isLoading } = useSWR<AirportLong>(`/map/airport/${icao}`, fetchApi, {
		refreshInterval: 60_000,
		shouldRetryOnError: false,
	});

	const [minimized, setMinimized] = useState(false);
	const [staticAirport, setStaticAirport] = useState<StaticAirport | null | undefined>();

	useEffect(() => {
		getCachedAirport(icao).then(setStaticAirport);
	}, [icao]);

	if (isLoading || staticAirport === undefined) return <LoadingPanel />;
	if (!staticAirport)
		return <NotFoundPanel title="Airport not found" description="This airport does not exist." onClick={() => removeSelected(`airport_${icao}`)} />;

	return (
		<div className="max-h-full glass-panel rounded-md pointer-events-auto overflow-hidden flex flex-col">
			<AirportHeader size="sm" icao={icao} onClose={() => removeSelected(`airport_${icao}`)} minimized={minimized} setMinimized={setMinimized} />
			{!minimized && (
				<div className="bg-muted/50 flex items-center justify-between gap-2 px-1.5 py-1">
					<AirportStatus icao={icao} size="sm" />
					<AirportConnections icao={icao} size="sm" />
				</div>
			)}
		</div>
	);
}
