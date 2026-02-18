"use client";

import { PanelGrid } from "@/components/Panel/PanelGrid";
import { useMapPageStore, useMapVisibilityStore } from "@/storage/zustand";
import FilterPanel from "./Filters/FilterPanel";
import SettingPanel from "./Settings/SettingPanel";

export default function BasePanel({ children }: { children: React.ReactNode }) {
	const { manualPage } = useMapPageStore();
	const { isHidden } = useMapVisibilityStore();

	if (isHidden) return null;

	return (
		<PanelGrid>
			{!manualPage && children}
			{manualPage === "filters" && <FilterPanel key="filters" />}
			{manualPage === "settings" && <SettingPanel key="settings" />}
		</PanelGrid>
	);
}
