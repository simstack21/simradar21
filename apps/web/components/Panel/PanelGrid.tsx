"use client";

export default function PanelGrid({ children }: { children: React.ReactNode }) {
	return <div className="h-full w-90 p-4 z-10 overflow-hidden pointer-events-none">{children}</div>;
}
