"use client";

import { useState } from "react";
import { MotionPanel } from "@/components/Panel/PanelGrid";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import FilterFooter from "./FilterFooter";
import FilterHeader from "./FilterHeader";
import FilterInput from "./FilterInput";
import FilterSelection from "./FilterSelection";

export default function FilterPanel() {
	const [minimized, setMinimized] = useState(false);

	return (
		<MotionPanel className="max-h-full glass-panel rounded-md pointer-events-auto overflow-hidden flex flex-col">
			<FilterHeader minimized={minimized} setMinimized={setMinimized} />
			{!minimized && (
				<ScrollArea className="max-h-full overflow-hidden flex flex-col bg-muted/50">
					<FilterSelection />
					<FilterInput />
					<ScrollBar />
				</ScrollArea>
			)}
			<FilterFooter />
		</MotionPanel>
	);
}
