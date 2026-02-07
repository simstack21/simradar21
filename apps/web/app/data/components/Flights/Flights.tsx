"use client";

import type { PilotLong } from "@sr24/types/interface";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PaginationState } from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/shared/Table";
import { fetchApi } from "@/lib/api";
import type { Flight } from "../../types/table";
import { columns } from "./columns";

async function fetchData(
	options: PaginationState & { callsign?: string; registration?: string },
): Promise<{ rows: Flight[]; pageCount: number; rowCount: number }> {
	const endpoint = options.callsign
		? `/data/flights/callsign/${options.callsign}?page=${options.pageIndex}&limit=${options.pageSize}`
		: `/data/flights/registration/${options.registration}?page=${options.pageIndex}&limit=${options.pageSize}`;
	const res = await fetchApi<{ flights: PilotLong[]; totalCount: number }>(endpoint);

	const flights = res.flights.map((p) => ({
		id: p.id,
		date: p.times?.sched_off_block,
		callsign: p.callsign,
		registration: p.flight_plan?.ac_reg,
		departure: p.flight_plan?.departure.icao,
		arrival: p.flight_plan?.arrival.icao,
		aircraft: p.aircraft,
		status: p.live,
		std: p.times?.sched_off_block,
		atd: p.times?.off_block,
		sta: p.times?.sched_on_block,
		ata: p.times?.on_block,
	}));

	return {
		rows: flights,
		pageCount: Math.ceil(res.totalCount / options.pageSize),
		rowCount: res.totalCount,
	};
}

export default function Flights({ callsign, registration }: { callsign?: string; registration?: string }) {
	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize: 10,
	});

	const { data, isPlaceholderData } = useQuery({
		queryKey: ["flights-page", callsign || registration, pagination],
		queryFn: () => fetchData({ ...pagination, callsign, registration }),
		placeholderData: keepPreviousData,
	});
	const defaultData = useMemo(() => [], []);

	const queryClient = useQueryClient();
	useEffect(() => {
		if (!isPlaceholderData) {
			const newPagination = { ...pagination, pageIndex: pagination.pageIndex + 1 };
			queryClient.prefetchQuery({
				queryKey: ["flights-page", callsign || registration, newPagination],
				queryFn: () => fetchData({ ...newPagination, callsign, registration }),
			});
		}
	}, [isPlaceholderData, pagination, queryClient, callsign, registration]);

	return (
		<DataTable
			columns={columns}
			data={data?.rows ?? defaultData}
			rowCount={data?.rowCount ?? 0}
			pagination={pagination}
			setPagination={setPagination}
		/>
	);
}
