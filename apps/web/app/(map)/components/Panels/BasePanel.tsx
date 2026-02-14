"use client";

import PanelGrid from "@/components/Panel/PanelGrid";
import { useMapPageStore } from "@/storage/zustand";
import FilterPanel from "./Filters/FilterPanel";

export default function BasePanel({ children }: { children: React.ReactNode }) {
	const { manualPage } = useMapPageStore();

	if (!manualPage) return <PanelGrid>{children}</PanelGrid>;

	if (manualPage === "filters")
		return (
			<PanelGrid>
				<FilterPanel />
			</PanelGrid>
		);
}
