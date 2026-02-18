import type { AirportLong } from "@sr24/types/interface";
import { Bar, BarChart, Legend, ResponsiveContainer, Tooltip, type TooltipContentProps, XAxis } from "recharts";
import useSWR from "swr";
import { renderLegend } from "@/components/shared/Chart";
import { fetchApi } from "@/lib/api";

export default function AirportExpected({ icao }: { icao: string }) {
	const { data: airportData } = useSWR<AirportLong>(`/map/airport/${icao}`, fetchApi, {
		refreshInterval: 60_000,
		shouldRetryOnError: false,
	});

	const data = getBarData(airportData);

	return (
		<div className="text-xs">
			<ResponsiveContainer width="100%" height={150} maxHeight={200}>
				<BarChart data={data}>
					<XAxis dataKey="step" axisLine={false} tickLine={false} interval="preserveStart" minTickGap={20} stroke="var(--muted-foreground)" />
					<Bar type="monotone" dataKey="departures" fill="var(--chart-1)" name="Departures" />
					<Bar type="monotone" dataKey="arrivals" fill="var(--chart-2)" name="Arrivals" />
					<Tooltip content={renderTooltip} />
					<Legend content={renderLegend} />
				</BarChart>
			</ResponsiveContainer>
		</div>
	);
}

const INDEX_INTERVAL_MIN = 30;
const INDEX_LIMITS_MIN = [-30, 360];

function getBarData(airportData: AirportLong | undefined) {
	if (!airportData?.expected) return [];

	const data = [];
	for (let i = 0; i < Math.ceil((INDEX_LIMITS_MIN[1] - INDEX_LIMITS_MIN[0]) / INDEX_INTERVAL_MIN); i++) {
		data.push({
			step: INDEX_LIMITS_MIN[0] + i * INDEX_INTERVAL_MIN,
			departures: airportData.expected.departure[i] || 0,
			arrivals: airportData.expected.arrival[i] || 0,
		});
	}

	return data;
}

function renderTooltip({ active, payload, label }: TooltipContentProps<string | number, string>) {
	const isVisible = active && payload && payload.length;
	if (!isVisible || label === undefined || label === null) return null;

	return (
		<div className="flex flex-col bg-background rounded-xl border p-2">
			<div className="font-bold">{Number(label) < 0 ? `${-label} min ago` : label === "0" ? "Now" : `In ${label} min`}</div>
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
