import type { DashboardData } from "@sr24/types/interface";
import { ActivityIcon } from "lucide-react";
import { useCallback, useId, useMemo } from "react";
import { Area, AreaChart, type DefaultLegendContentProps, Legend, ResponsiveContainer, Tooltip, type TooltipContentProps, XAxis } from "recharts";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { convertTime } from "@/lib/helpers";
import { useDashboardStore, useSettingsStore } from "@/storage/zustand";

export function DashboardHistory({ history }: { history: DashboardData["history"] }) {
	const id = useId();

	const { historyMode, setHistoryMode } = useDashboardStore();
	const { timeZone, timeFormat } = useSettingsStore();

	const filteredHistory = useMemo(() => {
		const now = Date.now();
		const cutoff = historyMode === "24 hours" ? now - 24 * 60 * 60 * 1000 : now - 7 * 24 * 60 * 60 * 1000;

		return history.filter(([timestamp]) => timestamp * 1000 >= cutoff);
	}, [history, historyMode]);

	const data = useMemo(
		() =>
			filteredHistory.map((point) => ({
				timestamp: point[0] * 1000,
				pilots: point[1],
				controllers: point[2],
			})),
		[filteredHistory],
	);

	const renderTooltip = useCallback(
		({ active, payload, label }: TooltipContentProps<string | number, string>) => {
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
								<span className="font-bold ml-auto">{entry.value}</span>
							</div>
						</div>
					))}
				</div>
			);
		},
		[timeFormat, timeZone],
	);

	return (
		<AccordionItem
			value="history"
			className="has-focus-visible:border-ring has-focus-visible:ring-ring/50 outline-none first:rounded-t-md last:rounded-b-md has-focus-visible:z-10 has-focus-visible:ring-[3px]"
		>
			<AccordionTrigger className="items-center">
				<div className="flex items-center w-full gap-4">
					<ActivityIcon className="size-4 shrink-0" />
					<span>Network Activity</span>
				</div>
			</AccordionTrigger>
			<AccordionContent className="p-0">
				<div className="absolute right-4 flex items-center gap-2 z-10">
					<Label htmlFor={id}>
						<span className="sr-only">Toggle switch</span>
						{historyMode === "24 hours" ? "24 Hours" : "7 Days"}
					</Label>
					<Switch
						id={id}
						checked={historyMode === "7 days"}
						onCheckedChange={(checked) => setHistoryMode(checked ? "7 days" : "24 hours")}
						onPointerDown={(e) => e.stopPropagation()}
						onClick={(e) => e.stopPropagation()}
						aria-label="Toggle switch"
					/>
				</div>
				<ResponsiveContainer width="100%" height={200} maxHeight={500}>
					<AreaChart data={data}>
						<XAxis
							dataKey="timestamp"
							axisLine={false}
							tickLine={false}
							interval="preserveStart"
							minTickGap={20}
							stroke="var(--muted-foreground)"
							tickFormatter={(value) => {
								const date = new Date(value);
								if (historyMode === "24 hours") {
									return convertTime(date, timeFormat, timeZone);
								} else {
									return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
								}
							}}
						/>
						<defs>
							<linearGradient id="primary" x1="0" y1="0" x2="0" y2="1">
								<stop offset="5%" stopColor="var(--primary)" stopOpacity={0.9} />
								<stop offset="95%" stopColor="var(--primary)" stopOpacity={0.1} />
							</linearGradient>
							<linearGradient id="secondary-foreground" x1="0" y1="0" x2="0" y2="1">
								<stop offset="5%" stopColor="var(--secondary-foreground)" stopOpacity={0.9} />
								<stop offset="95%" stopColor="var(--secondary-foreground)" stopOpacity={0.1} />
							</linearGradient>
						</defs>
						<Area type="monotone" dataKey="pilots" stroke="var(--primary)" strokeWidth={1.5} fill="url(#primary)" name="Pilots" />
						<Area
							type="monotone"
							dataKey="controllers"
							stroke="var(--secondary-foreground)"
							strokeWidth={1.5}
							fill="url(#secondary-foreground)"
							name="Controllers"
						/>
						<Tooltip content={renderTooltip} />
						<Legend content={renderLegend} />
					</AreaChart>
				</ResponsiveContainer>
			</AccordionContent>
		</AccordionItem>
	);
}

const renderLegend = ({ payload }: DefaultLegendContentProps) => {
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
};
