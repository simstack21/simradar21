"use client";

export default function PanelGrid({ children }: { children: React.ReactNode }) {
	return (
		<div className="h-full w-full lg:w-80 xl:w-90 flex flex-col justify-end lg:justify-start p-4 z-10 overflow-hidden pointer-events-none">
			{children}
		</div>
	);
}
