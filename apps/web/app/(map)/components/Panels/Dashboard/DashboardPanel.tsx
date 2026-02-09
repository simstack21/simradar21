"use client";

import useMediaQuery from "@mui/material/useMediaQuery";
import type { DashboardData } from "@sr24/types/interface";
import useSWR from "swr";
import { Accordion } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchApi } from "@/lib/api";
import { useDashboardPanelStore } from "@/storage/zustand";
import { DashboardEvents } from "./DashboardEvents";
import { DashboardHistory } from "./DashboardHistory";
import { DashboardStats } from "./DashboardStats";

export default function DashboardPanel() {
	const { data, isLoading } = useSWR<DashboardData>("/map/dashboard", fetchApi, { refreshInterval: 60_000 });
	const { panel, setPanel } = useDashboardPanelStore();
	const isMobile = useMediaQuery("(max-width: 1024px)");

	if (isLoading || !data) {
		return (
			<div className="max-h-full glass-panel rounded-md pointer-events-auto p-2">
				<div className="flex flex-col gap-1">
					<Skeleton className="h-6 w-2/3" />
					<Skeleton className="h-4 w-1/2" />
					<Skeleton className="aspect-video w-full" />
				</div>
			</div>
		);
	}

	return (
		<Accordion multiple={!isMobile} className="max-h-full glass-panel pointer-events-auto" value={panel} onValueChange={setPanel}>
			<DashboardHistory history={data.history} />
			<DashboardStats stats={data.stats} />
			<DashboardEvents events={data.events} />
		</Accordion>
	);
}
