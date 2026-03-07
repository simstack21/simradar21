"use client";

import type { FIRFeature, SimAwareTraconFeature, StaticAirline, StaticAirport } from "@sr24/types/db";
import type { AirportShort, ControllerMerged, ControllerShort } from "@sr24/types/interface";
import {
	ArrowDownRightIcon,
	ArrowUpRightIcon,
	CheckIcon,
	ClockIcon,
	CopyIcon,
	PlaneIcon,
	RadioIcon,
	RadioTowerIcon,
	TimerIcon,
	UsersIcon,
} from "lucide-react";
import type { Feature } from "ol";
import type { Point } from "ol/geom";
import { useState } from "react";
import { convertAltitude, convertSpeed, convertTime, convertVerticalSpeed, getOnlineTime } from "@/lib/helpers";
import { getControllerColor } from "@/lib/panels";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/storage/zustand";
import type { PilotProperties } from "@/types/ol";
import { AvatarAirline, AvatarCountry } from "../shared/Avatar";
import { Button } from "../ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../ui/hover-card";

export function PilotOverlay({ feature, airline, mini }: { feature: Feature<Point>; airline: StaticAirline | null; mini?: boolean }) {
	const { planeOverlay, altitudeUnit, verticalSpeedUnit, speedUnit } = useSettingsStore();

	const data = feature.getProperties() as PilotProperties;

	let hdg = String(data.heading);
	if (hdg.length === 1) {
		hdg = `00${hdg}`;
	}
	if (hdg.length === 2) {
		hdg = `0${hdg}`;
	}

	return (
		<div className="flex flex-col glass-panel rounded-md border outline overflow-hidden">
			{planeOverlay === "full" && !mini && (
				<div className="grid grid-cols-2 gap-x-2 text-xs p-0.5 pt-0">
					<div className="flex gap-2 justify-between">
						<span className="text-muted-foreground">ALT</span>
						<span className="font-mono">{data.altitude_ms && convertAltitude(Math.round(data.altitude_ms / 250) * 250, altitudeUnit)}</span>
					</div>
					<div className="flex gap-2 justify-between">
						<span className="text-muted-foreground">FPM</span>
						<span className="font-mono">
							{data.vertical_speed && convertVerticalSpeed(Math.round(data.vertical_speed / 50) * 50, verticalSpeedUnit, false)}
						</span>
					</div>
					<div className="flex gap-2 justify-between">
						<span className="text-muted-foreground">GS</span>
						<span className="font-mono">{data.groundspeed && convertSpeed(data.groundspeed, speedUnit)}</span>
					</div>
					<div className="flex gap-2 justify-between">
						<span className="text-muted-foreground">HDG</span>
						<span className="font-mono">{hdg}</span>
					</div>
				</div>
			)}
			{planeOverlay !== "callsign" && !mini && (
				<div className="flex items-center gap-x-1 bg-red text-white px-1 py-0.5">
					<AvatarAirline airline={airline} />
					<div className="flex flex-col text-xs">
						<div className="flex gap-4 justify-between items-center">
							<span className="text-sm font-bold">{data.callsign}</span>
							<span className="flex">
								{data.aircraft}
								<PlaneIcon size={16} className="ml-1" />
							</span>
						</div>
						<div className="flex gap-4 justify-between items-center">
							<span className="text-xs">{data.route?.replace(" ", " \u002d ")}</span>
							<span className="flex">
								{data.frequency && (data.frequency / 1000).toFixed(3)}
								<RadioIcon size={16} className="ml-1" />
							</span>
						</div>
					</div>
				</div>
			)}
			{(planeOverlay === "callsign" || mini) && <div className="bg-red text-white px-1 py-0.5 text-sm font-bold">{data.callsign}</div>}
		</div>
	);
}

export function AirportOverlay({
	cached,
	short,
	merged,
	mini,
}: {
	cached: StaticAirport | null;
	short: AirportShort | undefined;
	merged: ControllerMerged | undefined;
	mini?: boolean;
}) {
	const { airportOverlay } = useSettingsStore();

	const controllers = merged?.controllers as ControllerShort[] | undefined;
	const sortedControllers = controllers?.sort((a, b) => b.facility - a.facility);

	return (
		<div className="flex flex-col glass-panel rounded-md border outline overflow-hidden">
			{airportOverlay === "full" && !mini && <ControllerOverlay controllers={sortedControllers} />}
			{airportOverlay !== "callsign" && !mini && (
				<div className="flex items-center gap-x-1 bg-red text-white px-1 py-0.5">
					<AvatarCountry country={cached?.country || ""} />
					<div className="flex flex-col text-xs w-full">
						<div className="flex gap-4 justify-between items-center">
							<span className="text-sm font-bold">{cached?.name || "N/A"}</span>
							<span className="flex items-center">
								{short?.dep_traffic?.traffic_count || 0}
								<ArrowUpRightIcon size={16} className="ml-1" />
							</span>
						</div>
						<div className="flex gap-4 justify-between items-center">
							<span className="text-xs">{`${cached?.id || "N/A"} / ${cached?.iata || "N/A"}`}</span>
							<span className="flex items-center">
								{short?.arr_traffic?.traffic_count || 0}
								<ArrowDownRightIcon size={16} className="ml-1" />
							</span>
						</div>
					</div>
				</div>
			)}
			{(airportOverlay === "callsign" || mini) && <div className="bg-red text-white px-1 py-0.5 text-sm font-bold">{cached?.id || "N/A"}</div>}
		</div>
	);
}

export function SectorOverlay({
	cached,
	merged,
	mini,
}: {
	cached: SimAwareTraconFeature | FIRFeature | null;
	merged: ControllerMerged | undefined;
	mini?: boolean;
}) {
	const { sectorOverlay } = useSettingsStore();
	const controllers = merged?.controllers as ControllerShort[] | undefined;

	return (
		<div className="flex flex-col glass-panel rounded-md border outline overflow-hidden">
			{sectorOverlay === "full" && !mini && <ControllerOverlay controllers={controllers} />}
			{sectorOverlay !== "callsign" && !mini && (
				<div className="flex items-center gap-x-1 bg-red text-white px-1 py-0.5">
					<span
						className="h-8 w-8 text-white rounded-full flex justify-center items-center shrink-0"
						style={{ backgroundColor: getControllerColor(controllers && controllers[0].facility === 6 ? 6 : 5) }}
					>
						<RadioTowerIcon className="h-4 w-4" />
					</span>
					<div className="flex flex-col text-xs w-full">
						<div className="flex gap-4 justify-between items-center">
							<span className="text-sm font-bold">{cached?.properties.name || "N/A"}</span>
						</div>
						<div className="flex gap-4 justify-between items-center">
							<span className="text-xs">{cached?.properties.id || "N/A"}</span>
						</div>
					</div>
				</div>
			)}
			{(sectorOverlay === "callsign" || mini) && (
				<div className="bg-red text-white px-1 py-0.5 text-sm font-bold">{cached?.properties.name || "N/A"}</div>
			)}
		</div>
	);
}

function ControllerOverlay({ controllers }: { controllers: ControllerShort[] | undefined }) {
	const { timeFormat, timeZone } = useSettingsStore();
	const [copied, setCopied] = useState<string | null>(null);
	const [clicked, setClicked] = useState<string | null>(null);
	const [hovered, setHovered] = useState<string | null>(null);

	if (!controllers || controllers.length === 0) return null;

	const onCopy = (controller: ControllerShort) => {
		if (typeof window === "undefined") return;

		const atis = controller?.atis?.join("\n") || "";
		navigator.clipboard.writeText(atis);
		setCopied(controller.callsign);
		setTimeout(() => setCopied(null), 2000);
	};

	return (
		<div
			className="flex flex-col gap-1 p-0.5 pb-1"
			onPointerLeave={(e) => {
				if (e.pointerType === "mouse") {
					setHovered(null);
				}
			}}
		>
			{controllers?.map((c) => {
				return (
					<HoverCard key={c.callsign} open={hovered === c.callsign || clicked === c.callsign}>
						<HoverCardTrigger
							delay={10}
							closeDelay={100}
							render={
								<div
									key={c.callsign}
									className={cn(
										"flex items-center gap-2 text-xs bg-muted/50 border rounded-md py-0.5 px-1 hover:bg-muted",
										clicked === c.callsign && "bg-primary text-primary-foreground hover:text-white",
									)}
									onClick={() => setClicked(clicked === c.callsign ? null : c.callsign)}
									onPointerEnter={(e) => {
										if (e.pointerType === "mouse") {
											setHovered(c.callsign);
										}
									}}
								>
									<span className="h-2 w-2 rounded-xs shrink-0" style={{ backgroundColor: getControllerColor(c.facility) }} />
									<span className="font-medium pr-4 mr-auto">{c.callsign}</span>
									{c.frequency && (
										<div className="flex gap-1">
											<RadioIcon size={16} />
											<span className="font-mono">{(c.frequency / 1000).toFixed(3)}</span>
										</div>
									)}
									{c.connections !== undefined && (
										<div className="flex gap-1">
											<UsersIcon size={16} />
											<span className="font-mono">{String(c.connections).padStart(2, "0")}</span>
										</div>
									)}
									{c.logon_time && (
										<div className="flex gap-1">
											<TimerIcon size={16} />
											<span className="font-mono">{getOnlineTime(c.logon_time)}</span>
										</div>
									)}
									{c.booking && (
										<div className="flex gap-1">
											<ClockIcon size={16} />
											<span className="font-mono">{`${convertTime(c.booking.start, timeFormat, timeZone, false)}-${convertTime(c.booking.end, timeFormat, timeZone)}`}</span>
										</div>
									)}
								</div>
							}
						/>
						<HoverCardContent className="flex w-64 flex-col gap-0.5" side="right" sideOffset={8}>
							<span className="font-medium">{c.callsign} ATIS</span>
							<span className="text-xs mb-1">{c.atis?.join("\n") || "Currently unavailable"}</span>
							<Button variant="outline" onClick={() => onCopy(c)}>
								{copied === c.callsign ? <CheckIcon size={16} className="text-green" /> : <CopyIcon size={16} />}
							</Button>
						</HoverCardContent>
					</HoverCard>
				);
			})}
		</div>
	);
}
