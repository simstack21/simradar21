import type { TrackPoint } from "@sr24/types/interface";
import { ChartLineIcon } from "lucide-react";
import { Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { renderLegend, renderTooltip } from "@/components/shared/Chart";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { convertAltitude, convertSpeed, convertTime } from "@/lib/helpers";
import { useSettingsStore } from "@/storage/zustand";

export function PilotChart({ trackPoints }: { trackPoints: TrackPoint[] }) {
	const { altitudeUnit, speedUnit, timeFormat, timeZone } = useSettingsStore();

	const data = trackPoints.map((point) => ({
		timestamp: point.timestamp,
		altitude: convertAltitude(point.altitude_ms, altitudeUnit),
		speed: convertSpeed(point.groundspeed, speedUnit),
	}));

	return (
		<AccordionItem
			value="chart"
			className="overflow-hidden flex flex-col has-focus-visible:border-ring has-focus-visible:ring-ring/50 outline-none has-focus-visible:z-10 has-focus-visible:ring-[3px]"
		>
			<AccordionTrigger className="items-center">
				<div className="flex items-center gap-4">
					<ChartLineIcon className="size-4 shrink-0" />
					<span>Speed and Altitude Chart</span>
				</div>
			</AccordionTrigger>
			<AccordionContent className="pb-0">
				<ResponsiveContainer width="100%" height={200} maxHeight={500}>
					<LineChart data={data}>
						<XAxis
							dataKey="timestamp"
							axisLine={false}
							tickLine={false}
							interval="preserveStart"
							minTickGap={20}
							stroke="var(--muted-foreground)"
							tickFormatter={(value) => convertTime(new Date(value), timeFormat, timeZone)}
						/>
						<YAxis yAxisId="alt" tickLine={false} axisLine={false} tick={false} width={0} />
						<YAxis yAxisId="spd" tickLine={false} axisLine={false} tick={false} width={0} />
						<Line
							yAxisId="alt"
							type="monotone"
							dataKey="altitude"
							stroke="var(--primary)"
							strokeWidth={1.5}
							name={`Altitude (${altitudeUnit})`}
							dot={false}
						/>
						<Line
							yAxisId="spd"
							type="monotone"
							dataKey="speed"
							stroke="var(--secondary-foreground)"
							strokeWidth={1.5}
							name={`Speed (${speedUnit})`}
							dot={false}
						/>
						<Tooltip content={renderTooltip} />
						<Legend content={renderLegend} />
					</LineChart>
				</ResponsiveContainer>
			</AccordionContent>
		</AccordionItem>
	);
}
