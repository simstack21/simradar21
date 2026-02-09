"use client";

import type { DashboardData } from "@sr24/types/interface";
import useSWR from "swr";
import { Accordion } from "@/components/ui/accordion";
import { fetchApi } from "@/lib/api";
import { useDashboardStore } from "@/storage/zustand";
import { DashboardEvents } from "./DashboardEvents";
import { DashboardHistory } from "./DashboardHistory";
import { DashboardStats } from "./DashboardStats";

export default function DashboardPanel() {
	const { data, isLoading } = useSWR<DashboardData>("/map/dashboard", fetchApi, { refreshInterval: 60_000 });
	const { panel, setPanel } = useDashboardStore();

	if (isLoading || !data) {
		return <div className="p-4">Loading...</div>;
	}

	return (
		<Accordion
			multiple
			className="max-h-full outline border backdrop-blur-md bg-linear-to-r from-white/1 from-20% via-white/3 via-50% to-white/1 pointer-events-auto"
			value={panel}
			onValueChange={setPanel}
		>
			<DashboardHistory history={data.history} />
			<DashboardStats stats={data.stats} />
			<DashboardEvents events={data.events} />
		</Accordion>
	);
}
