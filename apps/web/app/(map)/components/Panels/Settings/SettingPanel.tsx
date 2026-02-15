"use client";

import { FlaskConicalIcon, PaletteIcon, PlaneIcon, RadioTowerIcon, SunriseIcon, TowerControlIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { type RgbaColor, RgbaColorPicker } from "react-colorful";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldContent, FieldTitle } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/storage/zustand";
import SettingFooter from "./SettingFooter";
import SettingHeader from "./SettingHeader";

export default function SettingPanel() {
	const [minimized, setMinimized] = useState(false);

	return (
		<div className="max-h-full glass-panel rounded-md pointer-events-auto overflow-hidden flex flex-col">
			<SettingHeader minimized={minimized} setMinimized={setMinimized} />
			{!minimized && (
				<ScrollArea className="max-h-full overflow-hidden flex flex-col bg-muted/50">
					<div className="p-2 flex flex-col gap-2">
						<DayNightSettings />
						<AirportSettings />
						<PlaneSettings />
						<SectorSettings />
					</div>
					<ScrollBar />
				</ScrollArea>
			)}
			<SettingFooter />
		</div>
	);
}

function DayNightSettings() {
	const { dayNightLayer, setDayNightLayer, dayNightLayerBrightness, setDayNightLayerBrightness } = useSettingsStore();

	return (
		<Field orientation="horizontal" className={cn("border rounded-md p-2 bg-muted/50", !dayNightLayer && "bg-transparent")}>
			<FieldContent className={cn("flex flex-col gap-2", !dayNightLayer && "opacity-50 pointer-events-none")}>
				<FieldTitle>
					<SunriseIcon size={16} />
					Day/Night Line
				</FieldTitle>
				<div className="flex flex-col gap-4">
					<div className="flex flex-col w-full gap-2">
						<div className="flex justify-between">
							<span className="text-xs">Brightness</span>
							<span className="text-xs text-muted-foreground ml-auto">{dayNightLayerBrightness}</span>
						</div>
						<Slider value={dayNightLayerBrightness} step={10} onValueChange={(value) => setDayNightLayerBrightness(value as number)} />
					</div>
				</div>
			</FieldContent>
			<Switch checked={dayNightLayer} onCheckedChange={(checked) => setDayNightLayer(checked)} />
		</Field>
	);
}

function AirportSettings() {
	const { airportMarkers, setAirportMarkers, airportMarkerSize, setAirportMarkerSize } = useSettingsStore();

	return (
		<Field orientation="horizontal" className={cn("border rounded-md p-2 bg-muted/50", !airportMarkers && "bg-transparent")}>
			<FieldContent className={cn("flex flex-col gap-2", !airportMarkers && "opacity-50 pointer-events-none")}>
				<FieldTitle>
					<PlaneIcon size={16} />
					Airport Markers
				</FieldTitle>
				<div className="flex flex-col gap-4">
					<div className="flex flex-col w-full gap-2">
						<div className="flex justify-between">
							<span className="text-xs">Marker Size</span>
							<span className="text-xs text-muted-foreground ml-auto">{airportMarkerSize}</span>
						</div>
						<Slider value={airportMarkerSize} step={10} onValueChange={(value) => setAirportMarkerSize(value as number)} />
					</div>
				</div>
			</FieldContent>
			<Switch checked={airportMarkers} onCheckedChange={(checked) => setAirportMarkers(checked)} />
		</Field>
	);
}

function PlaneSettings() {
	const {
		planeMarkers,
		setPlaneMarkers,
		planeOverlay,
		setPlaneOverlay,
		planeMarkerSize,
		setPlaneMarkerSize,
		animatedPlaneMarkers,
		setAnimatedPlaneMarkers,
	} = useSettingsStore();

	return (
		<Field orientation="horizontal" className={cn("border rounded-md p-2 bg-muted/50", !planeMarkers && "bg-transparent")}>
			<FieldContent className={cn("flex flex-col gap-2", !planeMarkers && "opacity-50 pointer-events-none")}>
				<FieldTitle>
					<TowerControlIcon size={16} />
					Plane Markers
				</FieldTitle>
				<div className="flex flex-col gap-4">
					<div className="flex flex-col w-full gap-2">
						<div className="flex justify-between">
							<span className="text-xs">Marker Size</span>
							<span className="text-xs text-muted-foreground ml-auto">{planeMarkerSize}</span>
						</div>
						<Slider value={planeMarkerSize} step={10} onValueChange={(value) => setPlaneMarkerSize(value as number)} />
					</div>
					<div className="flex flex-col w-full gap-2">
						<span className="text-xs">Overlay Details</span>
						<RadioGroup value={planeOverlay} onValueChange={setPlaneOverlay} className="flex justify-between">
							<div className="flex items-center gap-2">
								<RadioGroupItem value="callsign" id="callsign" />
								<Label htmlFor="callsign">Callsign</Label>
							</div>
							<div className="flex items-center gap-2">
								<RadioGroupItem value="telemetry-off" id="telemetry-off" />
								<Label htmlFor="telemetry-off">Telemetry Off</Label>
							</div>
							<div className="flex items-center gap-2">
								<RadioGroupItem value="full" id="full" />
								<Label htmlFor="full">Full</Label>
							</div>
						</RadioGroup>
					</div>
					<div className="flex flex-col gap-1">
						<div className="flex w-full items-center gap-2">
							<span className="text-xs">Animated Markers</span>
							<Badge className="bg-red">
								<FlaskConicalIcon />
								Experimental
							</Badge>
							<Switch checked={animatedPlaneMarkers} onCheckedChange={(checked) => setAnimatedPlaneMarkers(checked)} className="ml-auto" />
						</div>
						<span className="text-xs text-muted-foreground">Turn off to improve performance on low-end devices.</span>
					</div>
				</div>
			</FieldContent>
			<Switch checked={planeMarkers} onCheckedChange={(checked) => setPlaneMarkers(checked)} />
		</Field>
	);
}

function SectorSettings() {
	const { sectorAreas, setSectorAreas, traconColor, setTraconColor, firColor, setFirColor } = useSettingsStore();
	const [picker, setPicker] = useState<"tracon" | "fir" | null>(null);

	return (
		<Field orientation="horizontal" className={cn("border rounded-md p-2 bg-muted/50", !sectorAreas && "bg-transparent")}>
			<FieldContent className={cn("flex flex-col gap-2", !sectorAreas && "opacity-50 pointer-events-none")}>
				<FieldTitle>
					<RadioTowerIcon size={16} />
					Sector Areas
				</FieldTitle>
				<div className="flex flex-col gap-4">
					<div className="flex flex-col gap-2">
						<div className="flex w-full items-center justify-between gap-2">
							<span className="text-xs">FIR Color</span>
							<Button
								style={{ backgroundColor: `rgb(${firColor.r}, ${firColor.g}, ${firColor.b})` }}
								className={getContrastColor(firColor)}
								onClick={() => setPicker(picker === "fir" ? null : "fir")}
							>
								{picker === "fir" ? <XIcon /> : <PaletteIcon />}
							</Button>
						</div>
						{picker === "fir" && <RgbaColorPicker color={firColor} onChange={setFirColor} className="w-full!" />}
					</div>
					<div className="flex flex-col gap-2">
						<div className="flex w-full items-center justify-between gap-2">
							<span className="text-xs">TRACON Color</span>
							<Button
								style={{ backgroundColor: `rgb(${traconColor.r}, ${traconColor.g}, ${traconColor.b})` }}
								className={getContrastColor(traconColor)}
								onClick={() => setPicker(picker === "tracon" ? null : "tracon")}
							>
								{picker === "tracon" ? <XIcon /> : <PaletteIcon />}
							</Button>
						</div>
						{picker === "tracon" && <RgbaColorPicker color={traconColor} onChange={setTraconColor} className="w-full!" />}
					</div>
				</div>
			</FieldContent>
			<Switch checked={sectorAreas} onCheckedChange={(checked) => setSectorAreas(checked)} />
		</Field>
	);
}

function getContrastColor(rgba: RgbaColor) {
	const { r, g, b } = rgba;
	const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
	return luminance > 0.5 ? "text-black" : "text-white";
}
