"use client";

import useMediaQuery from "@mui/material/useMediaQuery";
import { PanelGrid } from "@/components/Panel/PanelGrid";
import { cn } from "@/lib/utils";
import { useMapPageStore, useMapVisibilityStore } from "@/storage/zustand";
import FilterPanel from "./Filters/FilterPanel";
import SettingPanel from "./Settings/SettingPanel";

export default function BasePanel({ children }: { children: React.ReactNode }) {
	const { manualPage } = useMapPageStore();
	const { isHidden, vatglasses } = useMapVisibilityStore();
	const isMobile = useMediaQuery("(max-width: 1024px)");

	if (isHidden) return null;

	return (
		<PanelGrid className={cn(isMobile && "mb-18 mt-14", isMobile && vatglasses && "mb-25")}>
			{!manualPage && children}
			{manualPage === "filters" && <FilterPanel key="filters" />}
			{manualPage === "settings" && <SettingPanel key="settings" />}
		</PanelGrid>
	);
}
