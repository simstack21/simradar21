"use client";

import { AnimatePresence, motion } from "motion/react";

export function PanelGrid({ children }: { children: React.ReactNode }) {
	return (
		<div className="h-full w-full lg:w-80 xl:w-90 flex flex-col justify-end lg:justify-start p-4 z-10 pointer-events-none">
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
