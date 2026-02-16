import type { StaticAirport } from "@sr24/types/db";
import type { AirportLong } from "@sr24/types/interface";
import {
	BanIcon,
	CloudDrizzleIcon,
	CloudFogIcon,
	CloudIcon,
	CloudLightningIcon,
	CloudMoonIcon,
	CloudRainIcon,
	CloudRainWindIcon,
	CloudSunIcon,
	CloudyIcon,
	EyeOffIcon,
	HazeIcon,
	MoonStarIcon,
	SnowflakeIcon,
	SunIcon,
} from "lucide-react";
import { CloudQuantity, Descriptive, type IMetar, Intensity, type IWind, Phenomenon, parseMetar } from "metar-taf-parser";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { Separator } from "@/components/ui/separator";
import { fetchApi } from "@/lib/api";
import { convertSpeed, convertTemperature } from "@/lib/helpers";
import { cn } from "@/lib/utils";
import { getCachedAirport } from "@/storage/cache";
import { useSettingsStore } from "@/storage/zustand";

type Condition =
	| null
	| "Clear"
	| "Thunderstorm"
	| "Heavy Rain"
	| "Rain"
	| "Heavy Snow"
	| "Snow"
	| "Drizzle"
	| "Fog"
	| "Mist"
	| "Hazy"
	| "Smoky"
	| "Overcast"
	| "Cloudy"
	| "Partly Cloudy"
	| "Few Clouds"
	| "Poor Visibility";

export function AirportStatus({ icao, size = "default" }: { icao: string; size?: "default" | "sm" }) {
	const { data: airportData } = useSWR<AirportLong>(`/map/airport/${icao}`, fetchApi, {
		refreshInterval: 60_000,
		shouldRetryOnError: false,
	});
	const { data: weatherData } = useSWR<{
		metar: string;
		taf: string;
	}>(`/map/airport/${icao}/weather`, fetchApi, {
		refreshInterval: 5 * 60_000,
		shouldRetryOnError: false,
	});

	const { temperatureUnit, windSpeedUnit } = useSettingsStore();
	const [time, setTime] = useState<string>("No Local Time");
	const [staticAirport, setStaticAirport] = useState<StaticAirport | null>(null);

	useEffect(() => {
		let interval: NodeJS.Timeout;

		(async () => {
			const staticAirport = await getCachedAirport(icao);
			if (!staticAirport?.timezone) return;

			setStaticAirport(staticAirport);

			const updateTime = () => {
				setTime(formatLocalTime(staticAirport.timezone));
			};
			updateTime();

			interval = setInterval(updateTime, 1000);
		})();

		return () => clearInterval(interval);
	}, [icao]);

	const parsedMetar = useMemo(() => (weatherData?.metar ? parseMetar(weatherData.metar) : null), [weatherData]);

	if (!airportData) return null;

	const condition = getConditionText(parsedMetar);

	return (
		<div className="flex items-center gap-2 text-xs">
			<span className={cn("bg-muted-foreground text-muted rounded-full flex justify-center items-center", size === "sm" ? "w-6 h-6" : "h-10 w-10")}>
				{getConditionIcon(condition, staticAirport?.timezone, size)}
			</span>
			<div className="flex flex-col gap-1">
				<div className={cn("font-bold", size === "sm" ? "text-xs" : "text-sm")}>{time}</div>
				<div className="flex gap-1.5 text-muted-foreground leading-none">
					{condition && parsedMetar ? (
						<>
							<span>{condition}</span>
							<Separator orientation="vertical" className="bg-muted-foreground" />
							<span>{convertTemperature(parsedMetar.temperature, temperatureUnit)}</span>
							<Separator orientation="vertical" className="bg-muted-foreground" />
							<span>{getWind(parsedMetar.wind, windSpeedUnit)}</span>
						</>
					) : (
						<span>No weather data</span>
					)}
				</div>
			</div>
		</div>
	);
}

function formatLocalTime(tz: string): string {
	const now = new Date();

	const time = new Intl.DateTimeFormat(undefined, {
		timeZone: tz,
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	}).format(now);

	const date = new Intl.DateTimeFormat(undefined, {
		month: "short",
		day: "numeric",
		timeZone: tz,
	}).format(now);

	return `${date} ${time}`;
}

function getConditionText(metar: IMetar | null): Condition {
	if (!metar) return null;
	if (metar.cavok) return "Clear";

	const weatherConditions = metar.weatherConditions || [];
	if (weatherConditions.some((w) => w.descriptive === Descriptive.THUNDERSTORM)) return "Thunderstorm";

	const hasHeavy = weatherConditions.some((w) => w.intensity === Intensity.HEAVY);
	const hasRain = weatherConditions.some((w) => w.phenomenons?.includes(Phenomenon.RAIN));
	const hasSnow = weatherConditions.some((w) => w.phenomenons?.includes(Phenomenon.SNOW));
	const hasDrizzle = weatherConditions.some((w) => w.phenomenons?.includes(Phenomenon.DRIZZLE));

	if (hasRain) return hasHeavy ? "Heavy Rain" : "Rain";
	if (hasSnow) return hasHeavy ? "Heavy Snow" : "Snow";
	if (hasDrizzle) return "Drizzle";

	if (weatherConditions.some((w) => w.phenomenons?.includes(Phenomenon.FOG))) return "Fog";
	if (weatherConditions.some((w) => w.phenomenons?.includes(Phenomenon.MIST))) return "Mist";
	if (weatherConditions.some((w) => w.phenomenons?.includes(Phenomenon.HAZE))) return "Hazy";
	if (weatherConditions.some((w) => w.phenomenons?.includes(Phenomenon.SMOKE))) return "Smoky";

	const clouds = metar.clouds || [];
	if (clouds.length === 0) return "Clear";
	if (clouds.some((c) => c.quantity === CloudQuantity.OVC)) return "Overcast";
	if (clouds.some((c) => c.quantity === CloudQuantity.BKN)) return "Cloudy";
	if (clouds.some((c) => c.quantity === CloudQuantity.SCT)) return "Partly Cloudy";
	if (clouds.some((c) => c.quantity === CloudQuantity.FEW)) return "Few Clouds";
	if (clouds.some((c) => c.quantity === CloudQuantity.SKC || c.quantity === CloudQuantity.NSC)) return "Clear";

	if (metar.visibility && metar.visibility.value < 5000) return "Poor Visibility";

	return "Clear";
}

function getConditionIcon(condition: Condition, tz: string | undefined, size: "default" | "sm" = "default") {
	const now = new Date();
	const hour = Number(
		new Intl.DateTimeFormat(undefined, {
			timeZone: tz,
			hour: "2-digit",
			hour12: false,
		}).format(now),
	);
	const isNight = hour < 6 || hour >= 19;
	const iconSize = size === "sm" ? 16 : 24;

	switch (condition) {
		case "Clear":
			return isNight ? <MoonStarIcon size={iconSize} /> : <SunIcon size={iconSize} />;
		case "Thunderstorm":
			return <CloudLightningIcon size={iconSize} />;
		case "Heavy Rain":
			return <CloudRainWindIcon size={iconSize} />;
		case "Rain":
			return <CloudRainIcon size={iconSize} />;
		case "Heavy Snow":
		case "Snow":
			return <SnowflakeIcon size={iconSize} />;
		case "Drizzle":
			return <CloudDrizzleIcon size={iconSize} />;
		case "Fog":
		case "Mist":
			return <CloudFogIcon size={iconSize} />;
		case "Hazy":
		case "Smoky":
			return <HazeIcon size={iconSize} />;
		case "Overcast":
		case "Cloudy":
			return <CloudyIcon size={iconSize} />;
		case "Partly Cloudy":
			return <CloudIcon size={iconSize} />;
		case "Few Clouds":
			return isNight ? <CloudMoonIcon size={iconSize} /> : <CloudSunIcon size={iconSize} />;
		case "Poor Visibility":
			return <EyeOffIcon size={iconSize} />;
		default:
			return <BanIcon size={iconSize} />;
	}
}

function getWind(wind: IWind | undefined, windUnit: "knots" | "kmh" | "mph" | "ms"): string {
	if (!wind) return "N/A";

	let factor = 1;

	if (wind.unit === "MPS") {
		factor = 1.94384;
	} else if (wind.unit === "KM/H") {
		factor = 0.539957;
	}

	const speed = convertSpeed(wind.speed * factor, windUnit);
	const gust = convertSpeed((wind.gust || 0) * factor, windUnit);

	let shortUnit = "KT";
	if (windUnit === "kmh") {
		shortUnit = "KMH";
	} else if (windUnit === "mph") {
		shortUnit = "MPH";
	} else if (windUnit === "ms") {
		shortUnit = "MS";
	}

	if (!wind.degrees) return `${wind.direction}@${speed}${wind.gust ? `G${gust}` : ""}${shortUnit}`;

	let degrees = wind.degrees.toString();
	if (degrees.length === 1) {
		degrees = `00${degrees}`;
	}
	if (degrees.length === 2) {
		degrees = `0${degrees}`;
	}

	return `${degrees}@${speed}${wind.gust ? `G${gust}` : ""}${shortUnit}`;
}
