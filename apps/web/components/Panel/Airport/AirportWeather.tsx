import { CloudSunRainIcon } from "lucide-react";
import { type IAltimeter, type IMetar, parseMetar, type Visibility } from "metar-taf-parser";
import { useMemo } from "react";
import useSWR from "swr";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { fetchApi } from "@/lib/api";
import { convertAltitude, convertTemperature, convertTime } from "@/lib/helpers";
import { useSettingsStore } from "@/storage/zustand";

export function AirportWeather({ icao }: { icao: string }) {
	const { data: weatherData } = useSWR<{
		metar: string;
		taf: string;
	}>(`/map/airport/${icao}/weather`, fetchApi, {
		refreshInterval: 5 * 60_000,
		shouldRetryOnError: false,
	});
	const { temperatureUnit, altitudeUnit, timeFormat, timeZone } = useSettingsStore();

	const parsedMetar = useMemo(() => (weatherData?.metar ? parseMetar(weatherData.metar) : null), [weatherData]);

	if (!weatherData) return null;

	return (
		<AccordionItem
			value="weather"
			className="overflow-hidden flex flex-col has-focus-visible:border-ring has-focus-visible:ring-ring/50 outline-none has-focus-visible:z-10 has-focus-visible:ring-[3px]"
		>
			<AccordionTrigger className="items-center data-panel-open:bg-muted">
				<div className="flex items-center gap-4">
					<CloudSunRainIcon className="size-4 shrink-0" />
					<span>More Weather and METAR</span>
				</div>
			</AccordionTrigger>
			<AccordionContent className="py-1 grid grid-cols-2 gap-1">
				<div className="flex flex-col">
					<span className="text-muted-foreground">Altimeter</span>
					<span>{getAltimeter(parsedMetar?.altimeter)}</span>
				</div>
				<div className="flex flex-col">
					<span className="text-muted-foreground">Dew Point</span>
					<span>{convertTemperature(parsedMetar?.dewPoint, temperatureUnit)}</span>
				</div>
				<div className="flex flex-col">
					<span className="text-muted-foreground">Humidity</span>
					<span>{getHumidity(parsedMetar)}</span>
				</div>
				<div className="flex flex-col">
					<span className="text-muted-foreground">Visibility</span>
					<span>{getVisibility(parsedMetar?.visibility)}</span>
				</div>
				<div className="flex flex-col">
					<span className="text-muted-foreground">Clouds</span>
					<span>{getClouds(parsedMetar, altitudeUnit)}</span>
				</div>
				<div className="flex flex-col">
					<span className="text-muted-foreground">Updated</span>
					<span>{getLastUpdated(parsedMetar, timeFormat, timeZone)}</span>
				</div>
				<div className="flex flex-col">
					<span className="text-muted-foreground">Remarks</span>
					<span>{parsedMetar?.remark || "N/A"}</span>
				</div>
				<div className="flex flex-col col-span-2">
					<span className="text-muted-foreground">Latest METAR</span>
					<span>{weatherData?.metar || "N/A"}</span>
				</div>
				<div className="flex flex-col col-span-2">
					<span className="text-muted-foreground">Latest TAF</span>
					<span>{weatherData?.taf || "N/A"}</span>
				</div>
			</AccordionContent>
		</AccordionItem>
	);
}

function getAltimeter(altimeter: IAltimeter | undefined): string {
	if (!altimeter) return "N/A";
	const unit = altimeter.unit || "inHg";
	return `${altimeter.value} ${unit}`;
}

function getHumidity(parsedMetar: IMetar | null): string {
	if (!parsedMetar || parsedMetar.temperature === undefined || parsedMetar.dewPoint === undefined) return "N/A";
	const humidity =
		100 *
		(Math.exp((17.625 * parsedMetar.dewPoint) / (243.04 + parsedMetar.dewPoint)) /
			Math.exp((17.625 * parsedMetar.temperature) / (243.04 + parsedMetar.temperature)));

	return `${humidity.toFixed(0)} %`;
}

function getVisibility(visibility: Visibility | undefined): string {
	if (!visibility) return "N/A";
	return `${visibility.value >= 9999 ? ">9999" : visibility.value} ${visibility.unit || "m"}`;
}

function getClouds(parsedMetar: IMetar | null, altitudeUnit: "feet" | "meters"): string {
	if (!parsedMetar || !parsedMetar.clouds || parsedMetar.clouds.length === 0) return "N/A";

	const quantityPriority: Record<string, number> = {
		OVC: 4,
		BKN: 3,
		SCT: 2,
		FEW: 1,
		SKC: 0,
		NSC: 0,
	};
	const maxCloud = parsedMetar.clouds.reduce((max, cloud) => {
		const currentPriority = quantityPriority[cloud.quantity] || 0;
		const maxPriority = quantityPriority[max.quantity] || 0;
		return currentPriority > maxPriority ? cloud : max;
	}, parsedMetar.clouds[0]);

	if (!maxCloud || !maxCloud.height) return "N/A";

	return `${maxCloud.quantity} @ ${convertAltitude(maxCloud.height, altitudeUnit)}`;
}

function getLastUpdated(parsedMetar: IMetar | null, timeFormat: "24h" | "12h", timeZone: "local" | "utc"): string {
	if (!parsedMetar || !parsedMetar.hour || !parsedMetar.minute) return "N/A";
	return convertTime(new Date().setUTCHours(parsedMetar.hour, parsedMetar.minute, 0, 0), timeFormat, timeZone);
}
