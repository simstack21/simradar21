"use client";

import type { DefaultLegendContentProps, TooltipContentProps } from "recharts";
import { convertTime } from "@/lib/helpers";
import { useSettingsStore } from "@/storage/zustand";

export function renderLegend({ payload }: DefaultLegendContentProps) {
	if (!payload) return null;

	return (
		<div className="flex gap-4 justify-center">
			{payload.map((entry) => (
				<div key={entry.value} className="flex items-center gap-2">
					<span style={{ backgroundColor: entry.color }} className="h-2 w-2 rounded-xs" />
					<span className="text-foreground">{entry.value}</span>
				</div>
			))}
		</div>
	);
}

export function renderTooltip({ active, payload, label }: TooltipContentProps<string | number, string>) {
	const { timeFormat, timeZone } = useSettingsStore();

	const isVisible = active && payload && payload.length;
	if (!isVisible || !label) return null;

	const date = new Date(label);

	return (
		<div className="flex flex-col bg-background rounded-xl border p-2">
			<div className="font-bold">
				{date.toLocaleDateString(undefined, { month: "short", day: "numeric" })} {convertTime(date, timeFormat, timeZone)}
			</div>
			{payload.map((entry) => (
				<div key={entry.name} className="flex items-center gap-1.5">
					<span style={{ backgroundColor: entry.color }} className="h-2.5 w-2.5 rounded-xs shrink-0" />
					<div className="flex justify-between w-full gap-4">
						<span className="text-muted-foreground">{entry.name}</span>
						<span className="font-bold ml-auto font-mono">{entry.value}</span>
					</div>
				</div>
			))}
		</div>
	);
}
