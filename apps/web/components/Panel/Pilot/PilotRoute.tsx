import type { StaticAirport } from "@sr24/types/db";
import type { PilotLong, PilotTimes } from "@sr24/types/interface";
import { ArrowDownToLineIcon, MoveDownIcon, MoveDownRightIcon, MoveRightIcon, MoveUpRightIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { AvatarCountry } from "@/components/shared/Avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { convertDistance, convertTime, haversineDistance } from "@/lib/helpers";
import { getDelayColorFromDates, getPilotTimeStatus, pilotAirportTimeMapping } from "@/lib/panels";
import { getCachedAirport } from "@/storage/cache";
import { useSettingsStore } from "@/storage/zustand";

export default function PilotRoute({ size, pilot }: { size?: "default" | "sm"; pilot: PilotLong }) {
	if (size === "sm") {
		return (
			<div className="flex items-center gap-1">
				<AirportInfo pilot={pilot} type="departure" size="sm" />
				<MoveRightIcon size={16} className="w-6" />
				<AirportInfo pilot={pilot} type="arrival" size="sm" />
			</div>
		);
	}

	return (
		<div className="p-2 bg-muted/50 flex flex-col gap-4">
			<div className="flex flex-col">
				<AirportInfo pilot={pilot} type="departure" size="default" />
				<MoveDownIcon size={16} className="w-6" />
				<AirportInfo pilot={pilot} type="arrival" size="default" />
			</div>
			<PilotProgress pilot={pilot} size="default" />
		</div>
	);
}

function AirportInfo({ pilot, type, size }: { pilot: PilotLong; type: "departure" | "arrival"; size: "default" | "sm" }) {
	const { timeFormat, timeZone } = useSettingsStore();
	const [airport, setAirport] = useState<StaticAirport | null>(null);

	const icao = pilot.flight_plan?.[type].icao;
	const timeStatus = getPilotTimeStatus(pilot.times);

	useEffect(() => {
		if (!icao) return;
		getCachedAirport(icao).then(setAirport);
	}, [icao]);

	if (size === "sm") {
		return (
			<div className="flex gap-2 items-center text-xs overflow-hidden">
				<AvatarCountry country={airport?.country || ""} size="sm" />
				<div className="flex flex-col overflow-hidden">
					<span className="text-sm font-bold">{airport?.id || icao || "N/A"}</span>
					<span>{convertTime(pilot.times?.[pilotAirportTimeMapping[type][1]], timeFormat, timeZone, true, airport?.timezone)}</span>
				</div>
			</div>
		);
	}

	return (
		<div className="flex gap-2 items-center text-xs overflow-hidden">
			<AvatarCountry country={airport?.country || ""} size="sm" />
			<div className="flex flex-col overflow-hidden">
				<span className="text-sm font-bold">{airport?.id || icao || "N/A"}</span>
				<span className="text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">{airport?.name || "Unknown"}</span>
			</div>
			<div className="flex flex-col ml-auto mt-auto shrink-0">
				<div className="flex gap-1">
					<span className="text-xs text-muted-foreground">sch</span>
					<span className="ml-auto">
						{convertTime(pilot.times?.[pilotAirportTimeMapping[type][0]], timeFormat, timeZone, true, airport?.timezone)}
					</span>
				</div>
				<div className="flex gap-1">
					<span className="text-xs text-muted-foreground">{timeStatus[type] ? "act" : "est"}</span>
					<span className="ml-auto">
						{convertTime(pilot.times?.[pilotAirportTimeMapping[type][1]], timeFormat, timeZone, true, airport?.timezone)}
					</span>
				</div>
			</div>
		</div>
	);
}

export function PilotProgress({ pilot, size }: { pilot: PilotLong; size: "default" | "sm" }) {
	const { distanceUnit } = useSettingsStore();
	const [airports, setAirports] = useState<{ departure: StaticAirport | null; arrival: StaticAirport | null }>({ departure: null, arrival: null });

	useEffect(() => {
		if (!pilot.flight_plan) return;
		Promise.all([getCachedAirport(pilot.flight_plan.departure.icao), getCachedAirport(pilot.flight_plan.arrival.icao)]).then(
			([departure, arrival]) => {
				setAirports({ departure, arrival });
			},
		);
	}, [pilot]);

	const [departureDistKm, arrivalDistKm, progress, timeSinceDeparture, timeUntilArrival, delayColor, delayStatus] = calculateProgressValues(
		pilot,
		airports.departure,
		airports.arrival,
	);

	if (size === "sm") {
		return <Progress value={progress} className="w-full max-w-sm" />;
	}

	return (
		<div className="flex flex-col text-xs gap-1">
			<div className="flex justify-between">
				<div className="flex gap-1.5">{getProgressLabel(pilot.times?.state)}</div>
				<Badge variant="outline">
					<span style={{ backgroundColor: `var(--${delayColor})` }} className="size-1.5 rounded-full" aria-hidden="true" />
					{delayStatus}
				</Badge>
			</div>
			<Progress value={progress} className="w-full max-w-sm" />
			<div className="flex justify-between">
				<span className="text-muted-foreground">{`${convertDistance(departureDistKm, distanceUnit)}, ${timeSinceDeparture}`}</span>
				<span className="text-muted-foreground">{`${convertDistance(arrivalDistKm, distanceUnit)}, ${timeUntilArrival}`}</span>
			</div>
		</div>
	);
}

function calculateProgressValues(
	pilot: PilotLong,
	departure: StaticAirport | null,
	arrival: StaticAirport | null,
): [number, number, number, string, string, "green" | "yellow" | "red" | null, "On Time" | "Delayed" | "Unknown"] {
	const departureDistKm = departure ? haversineDistance([departure.latitude, departure.longitude], [pilot.latitude, pilot.longitude]) : 0;
	const arrivalDistKm = arrival ? haversineDistance([arrival.latitude, arrival.longitude], [pilot.latitude, pilot.longitude]) : 0;
	const totalDistKm = departureDistKm + arrivalDistKm;

	const progress = totalDistKm > 0 ? Math.round((departureDistKm / totalDistKm) * 100) : 0;

	if (!pilot.times) return [departureDistKm, arrivalDistKm, progress, "N/A", "N/A", null, "Unknown"];

	const now = Date.now();
	let tSinceDep = "";
	let tUntilArr = "";

	if (pilot.times.off_block > now) {
		const delta = Math.floor((pilot.times.off_block - now) / 60000);
		tSinceDep = `in ${formatTimeDelta(delta)}`;
	} else {
		const delta = Math.floor((now - pilot.times.off_block) / 60000);
		tSinceDep = `${formatTimeDelta(delta)} ago`;
	}

	if (pilot.times.on_block > now) {
		const delta = Math.floor((pilot.times.on_block - now) / 60000);
		tUntilArr = `in ${formatTimeDelta(delta)}`;
	} else {
		const delta = Math.floor((now - pilot.times.on_block) / 60000);
		tUntilArr = `${formatTimeDelta(delta)} ago`;
	}

	const delayColor = getDelayColorFromDates(pilot.times.sched_on_block, pilot.times.on_block);
	return [departureDistKm, arrivalDistKm, progress, tSinceDep, tUntilArr, delayColor, delayColor === "green" ? "On Time" : "Delayed"];
}

function formatTimeDelta(minutes: number): string {
	if (minutes < 60) {
		return `${minutes} min`;
	}
	const hours = Math.floor(minutes / 60);
	const remainingMinutes = minutes % 60;
	return `${hours}h ${remainingMinutes}m`;
}

function getProgressLabel(status: PilotTimes["state"] | undefined) {
	switch (status) {
		case "Climb":
			return (
				<>
					Climbing <MoveUpRightIcon size={16} />
				</>
			);
		case "Cruise":
			return (
				<>
					Cruising <MoveRightIcon size={16} />
				</>
			);
		case "Descent":
			return (
				<>
					Descending <MoveDownRightIcon size={16} />
				</>
			);
		default:
			return (
				<>
					On Ground <ArrowDownToLineIcon size={16} />
				</>
			);
	}
}
