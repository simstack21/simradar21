"use client";

import useMediaQuery from "@mui/material/useMediaQuery";
import Clock from "@/components/shared/Clock";
import { useMapVisibilityStore } from "@/storage/zustand";
import Controls from "./Controls";
import Metrics from "./Metrics";

export default function Footer() {
	const { isHidden } = useMapVisibilityStore();
	const isMobile = useMediaQuery("(max-width: 1024px)");

	if (isMobile)
		return (
			<footer className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center gap-2 py-1 px-2 rounded-xl overflow-hidden glass-panel w-[calc(100%-2rem)]">
				<Controls />
				{!isHidden && (
					<div className="flex items-center justify-center gap-4 text-xs">
						<Metrics />
						<Clock />
					</div>
				)}
			</footer>
		);

	return (
		<footer className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center gap-2 py-1 px-2 rounded-xl overflow-hidden glass-panel">
			<Controls />
			{!isHidden && (
				<div className="flex items-center justify-center gap-4 text-xs">
					<Metrics />
					<Clock />
				</div>
			)}
		</footer>
	);
}
