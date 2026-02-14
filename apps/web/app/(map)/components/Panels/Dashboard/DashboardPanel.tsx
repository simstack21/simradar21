"use client";

import useMediaQuery from "@mui/material/useMediaQuery";
import type { DashboardData } from "@sr24/types/interface";
import useSWR from "swr";
import LoadingPanel from "@/components/Panel/Loading";
import { Accordion } from "@/components/ui/accordion";
import { fetchApi } from "@/lib/api";
import { useDashboardPanelStore } from "@/storage/zustand";
import { DashboardEvents } from "./DashboardEvents";
import { DashboardHistory } from "./DashboardHistory";
import { DashboardStats } from "./DashboardStats";

export default function DashboardPanel() {
	const { data, isLoading } = useSWR<DashboardData>("/map/dashboard", fetchApi, { refreshInterval: 60_000 });
	const { panel, setPanel } = useDashboardPanelStore();
	const isMobile = useMediaQuery("(max-width: 1024px)");

	if (isLoading || !data) return <LoadingPanel dashboard />;

	return (
		<Accordion multiple={!isMobile} className="max-h-full glass-panel pointer-events-auto" value={panel} onValueChange={setPanel}>
			<DashboardHistory history={data.history} />
			<DashboardStats stats={data.stats} />
			<DashboardEvents events={data.events} />
		</Accordion>
	);
}
