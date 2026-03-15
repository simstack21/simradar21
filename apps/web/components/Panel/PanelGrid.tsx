"use client";

import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";

export function PanelGrid({ children, className }: { children: React.ReactNode; className?: string }) {
	return (
		<div className={cn("h-full w-full lg:w-80 xl:w-90 flex flex-col justify-end lg:justify-start p-4 z-10 pointer-events-none", className)}>
			<AnimatePresence mode="wait">{children}</AnimatePresence>
		</div>
	);
}

export function MotionPanel({ children, className }: { children: React.ReactNode; className?: string }) {
	return (
		<motion.div className={className} initial={{ x: -400 }} animate={{ x: 0 }} exit={{ x: -400 }}>
			{children}
		</motion.div>
	);
}
