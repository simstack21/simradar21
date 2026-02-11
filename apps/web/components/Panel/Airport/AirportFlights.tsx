"use client";

import type { StaticAirline, StaticAirport } from "@sr24/types/db";
import type { PilotLong } from "@sr24/types/interface";
import { type InfiniteData, useInfiniteQuery } from "@tanstack/react-query";
import { ScanEyeIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Fragment } from "react/jsx-runtime";
import { AvatarAirline } from "@/components/shared/Avatar";
import { BadgePilotStatus } from "@/components/shared/Badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { fetchApi } from "@/lib/api";
import { convertTime } from "@/lib/helpers";
import { getDelayColorFromDates, getPilotTimeStatus, pilotAirportTimeMapping } from "@/lib/panels";
import { getCachedAirline, getCachedAirport } from "@/storage/cache";
import { useSettingsStore } from "@/storage/zustand";

type PageParam = { cursor?: string; backwards?: boolean };

const LIMIT = 20;

export default function AirportFlights({ icao, direction }: { icao: string; direction: "departure" | "arrival" }) {
	const { status, data, error, isFetchingNextPage, isFetchingPreviousPage, fetchNextPage, fetchPreviousPage, hasNextPage, hasPreviousPage } =
		useInfiniteQuery<PilotLong[], Error, InfiniteData<PilotLong[]>, readonly [string, string, "departure" | "arrival"], PageParam>({
			queryKey: ["airport-flights", icao.toUpperCase(), direction] as const,
			queryFn: async ({ pageParam }) => {
				const params = new URLSearchParams({ direction: direction, limit: String(LIMIT) });

				if (pageParam?.cursor) {
					params.set("cursor", pageParam.cursor);
					if (pageParam.backwards) params.set("backwards", "true");
				}

				return await fetchApi<PilotLong[]>(`/map/airport/${icao.toUpperCase()}/pilots?${params.toString()}`);
			},
			initialPageParam: {},
			getNextPageParam: (lastPage) => {
				if (!lastPage || lastPage.length < LIMIT) return undefined;
				const lastPilot = lastPage[lastPage.length - 1];
				return { cursor: lastPilot.id, backwards: false };
			},
			getPreviousPageParam: (firstPage, allPages) => {
				if (!firstPage || firstPage.length === 0) return undefined;
				if (allPages.length > 1 && firstPage.length < LIMIT) return undefined;
				const firstPilot = firstPage[0];
				return { cursor: firstPilot.id, backwards: true };
			},
			staleTime: 30_000,
			gcTime: 60_000,
		});

	if (status === "error") return <span>Error: {error?.message || "Failed"}</span>;

	return (
		<div className="flex flex-col gap-2 px-2 overflow-hidden">
			<Button onClick={() => fetchPreviousPage()} disabled={!hasPreviousPage || isFetchingPreviousPage} className="w-full">
				{isFetchingPreviousPage && <Spinner />}
				{hasPreviousPage ? "Load Earlier" : "No earlier"}
			</Button>
			<ScrollArea className="max-h-full pr-2 overflow-hidden">
				<div className="flex flex-col gap-1">
					{data?.pages.map((page, i) => (
						<Fragment key={i}>
							{page.map((p) => (
								<ListItem key={p.id} pilot={p} direction={direction} />
							))}
						</Fragment>
					))}
				</div>
				<ScrollBar />
			</ScrollArea>
			<Button onClick={() => fetchNextPage()} disabled={!hasNextPage || isFetchingNextPage} className="w-full">
				{isFetchingNextPage && <Spinner />}
				{hasNextPage ? "Load Later" : "No later"}
			</Button>
		</div>
	);
}

function ListItem({ pilot, direction }: { pilot: PilotLong; direction: "departure" | "arrival" }) {
	const router = useRouter();
	const { timeFormat, timeZone } = useSettingsStore();

	const [data, setData] = useState<{ airline: StaticAirline | null; departure: StaticAirport | null; arrival: StaticAirport | null }>({
		airline: null,
		departure: null,
		arrival: null,
	});

	useEffect(() => {
		const airlineCode = pilot.callsign.slice(0, 3).toUpperCase();

		Promise.all([
			getCachedAirline(airlineCode || ""),
			getCachedAirport(pilot.flight_plan?.departure.icao || ""),
			getCachedAirport(pilot.flight_plan?.arrival.icao || ""),
		]).then(([airline, departure, arrival]) => {
			setData({ airline, departure, arrival });
		});
	}, [pilot]);

	const onPilotClick = () => {
		if (pilot.live === "live") {
			router.push(`/pilot/${pilot.id}`);
			return;
		}
		router.push(`/data/flights/${pilot.callsign}/${pilot.id}`);
	};

	const timeStatus = getPilotTimeStatus(pilot.times);
	const targetAirport = direction === "departure" ? data.arrival : data.departure;

	return (
		<div className="flex flex-col bg-muted/50 rounded-md border overflow-hidden">
			<div className="flex items-center gap-2 bg-muted px-2 py-1 overflow-hidden">
				<span className="text-sm font-bold">{targetAirport?.id || "N/A"}</span>
				<span className="text-xs text-muted-foreground overflow-hidden whitespace-nowrap text-ellipsis">
					{targetAirport?.name || "Unknown Airport"}
				</span>
				<BadgePilotStatus status={pilot.live} className="ml-auto" />
				<Button variant="outline" size="icon-sm" onClick={() => router.push(`/airport/${targetAirport?.id || ""}`)} disabled={!targetAirport}>
					<ScanEyeIcon size={16} />
					<span className="sr-only">View Airport</span>
				</Button>
			</div>
			<div className="flex gap-2 items-center px-2 py-1">
				<AvatarAirline airline={data.airline} />
				<div className="flex flex-col overflow-hidden">
					<span className="text-sm">{pilot.callsign}</span>
					<span className="text-xs text-muted-foreground overflow-hidden whitespace-nowrap text-ellipsis">
						{pilot.aircraft} | {data.airline?.name || "Unknown Airline"}
					</span>
				</div>
				<div className="flex flex-col gap-1 ml-auto shrink-0 text-xs">
					<div className="flex items-center gap-1">
						<span className="h-2 w-2 shrink-0 mr-0.5" />
						<span className="text-muted-foreground">sch</span>
						<span className="ml-auto">
							{convertTime(pilot.times?.[pilotAirportTimeMapping[direction][0]], timeFormat, timeZone, true, data[direction]?.timezone)}
						</span>
					</div>
					<div className="flex items-center gap-1">
						<span
							className="h-2 w-2 rounded-xs animate-pulse shrink-0 mr-0.5"
							style={{
								backgroundColor: `var(--${getDelayColorFromDates(pilot.times?.[pilotAirportTimeMapping[direction][0]], pilot.times?.[pilotAirportTimeMapping[direction][1]])})`,
							}}
						/>
						<span className="text-muted-foreground">{timeStatus[direction] ? "act" : "est"}</span>
						<span className="ml-auto">
							{convertTime(pilot.times?.[pilotAirportTimeMapping[direction][1]], timeFormat, timeZone, true, data[direction]?.timezone)}
						</span>
					</div>
				</div>
				<Button variant="outline" size="icon-sm" onClick={onPilotClick}>
					<ScanEyeIcon size={16} />
					<span className="sr-only">View Pilot</span>
				</Button>
			</div>
		</div>
	);
}
