import { SettingsIcon } from "lucide-react";
import { useState } from "react";
import { useSettingsStore } from "@/storage/zustand";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

export default function DialogSettings() {
	const [open, setOpen] = useState(false);
	const {
		timeZone,
		setTimeZone,
		timeFormat,
		setTimeFormat,
		temperatureUnit,
		setTemperatureUnit,
		speedUnit,
		setSpeedUnit,
		verticalSpeedUnit,
		setVerticalSpeedUnit,
		windSpeedUnit,
		setWindSpeedUnit,
		altitudeUnit,
		setAltitudeUnit,
		distanceUnit,
		setDistanceUnit,
	} = useSettingsStore();

	return (
		<>
			<Tooltip>
				<TooltipTrigger
					delay={100}
					render={
						<Button variant="ghost" onClick={() => setOpen(true)}>
							<SettingsIcon data-icon="inline-start" />
						</Button>
					}
				></TooltipTrigger>
				<TooltipContent>
					<div className="flex items-center gap-2">Open Settings</div>
				</TooltipContent>
			</Tooltip>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="sm:max-w-md bg-popover">
					<DialogHeader>
						<DialogTitle>General Settings</DialogTitle>
						<DialogDescription>These settings will affect all pages and are not map-specific.</DialogDescription>
					</DialogHeader>
					<div className="flex flex-col gap-4">
						<RadioSwitch label="Time Zone" options={["utc", "local"]} value={timeZone} onValueChange={(value) => setTimeZone(value)} />
						<RadioSwitch label="Time Format" options={["24h", "12h"]} value={timeFormat} onValueChange={(value) => setTimeFormat(value)} />
						<RadioSwitch
							label="Temperature"
							options={["celsius", "fahrenheit"]}
							value={temperatureUnit}
							onValueChange={(value) => setTemperatureUnit(value)}
						/>
						<RadioSwitch label="Speed" options={["knots", "kmh", "mph", "ms"]} value={speedUnit} onValueChange={(value) => setSpeedUnit(value)} />
						<RadioSwitch
							label="Vertical Speed"
							options={["fpm", "ms"]}
							value={verticalSpeedUnit}
							onValueChange={(value) => setVerticalSpeedUnit(value)}
						/>
						<RadioSwitch
							label="Wind Speed"
							options={["knots", "kmh", "mph", "ms"]}
							value={windSpeedUnit}
							onValueChange={(value) => setWindSpeedUnit(value)}
						/>
						<RadioSwitch label="Altitude" options={["feet", "meters"]} value={altitudeUnit} onValueChange={(value) => setAltitudeUnit(value)} />
						<RadioSwitch label="Distance" options={["nm", "km", "miles"]} value={distanceUnit} onValueChange={(value) => setDistanceUnit(value)} />
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}

function RadioSwitch<const T extends readonly string[]>({
	label,
	options,
	value,
	onValueChange,
}: {
	label: string;
	options: T;
	value?: T[number];
	onValueChange?: (value: T[number]) => void;
}) {
	return (
		<div className="flex flex-col w-full gap-2">
			<span className="text-xs">{label}</span>
			<RadioGroup value={value} onValueChange={onValueChange} className="flex">
				{options.map((option) => (
					<div key={option} className="flex items-center gap-2">
						<RadioGroupItem value={option} id={option} />
						<Label htmlFor={option}>{option}</Label>
					</div>
				))}
			</RadioGroup>
		</div>
	);
}
