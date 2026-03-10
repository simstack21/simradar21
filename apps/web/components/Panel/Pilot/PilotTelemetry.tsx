import type { PilotLong, TrackPoint } from "@sr24/types/interface";
import { GaugeIcon } from "lucide-react";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { convertAltitude, convertSpeed, convertVerticalSpeed, roundAltitude } from "@/lib/helpers";
import { useSettingsStore } from "@/storage/zustand";

export function PilotTelemetry({ pilot, trackPoint, size }: { pilot: PilotLong; trackPoint?: TrackPoint; size?: "default" | "sm" }) {
	const { altitudeUnit, speedUnit, verticalSpeedUnit } = useSettingsStore();

	let hdg = String(trackPoint?.heading ?? pilot.heading);
	if (hdg.length === 1) {
		hdg = `00${hdg}`;
	}
	if (hdg.length === 2) {
		hdg = `0${hdg}`;
	}

	if (size === "sm") {
		return (
			<div className="grid grid-cols-2 gap-y-1 gap-x-2 text-xs">
				<div className="flex gap-1 justify-between">
					<span className="text-muted-foreground">ALT</span>
					<span>{convertAltitude(roundAltitude(trackPoint?.altitude_ms ?? pilot.altitude_ms), altitudeUnit)}</span>
				</div>
				<div className="flex gap-1 justify-between">
					<span className="text-muted-foreground">SPD</span>
					<span>{convertSpeed(trackPoint?.groundspeed ?? pilot.groundspeed, speedUnit)}</span>
				</div>
				<div className="flex gap-1 justify-between">
					<span className="text-muted-foreground">V/S</span>
					<span>{convertVerticalSpeed(Math.round((trackPoint?.vertical_speed ?? pilot.vertical_speed) / 50) * 50, verticalSpeedUnit, false)}</span>
				</div>
				<div className="flex gap-1 justify-between">
					<span className="text-muted-foreground">TRK</span>
					<span>{hdg}</span>
				</div>
			</div>
		);
	}

	return (
		<AccordionItem value="telemetry" className="overflow-hidden flex flex-col">
			<AccordionTrigger className="items-center data-panel-open:bg-muted">
				<div className="flex items-center gap-4">
					<GaugeIcon className="size-4 shrink-0" />
					<span>Telemetry</span>
				</div>
			</AccordionTrigger>
			<AccordionContent className="py-1 grid grid-cols-2 gap-1">
				<div className="flex flex-col">
					<span className="text-muted-foreground">Barometric Altitude</span>
					<span>{convertAltitude(roundAltitude(trackPoint?.altitude_ms ?? pilot.altitude_ms), altitudeUnit, true)}</span>
				</div>
				<div className="flex flex-col">
					<span className="text-muted-foreground">Radar Altitude</span>
					<span>{convertAltitude(roundAltitude(trackPoint?.altitude_agl ?? pilot.altitude_agl), altitudeUnit, true)}</span>
				</div>
				<div className="flex flex-col">
					<span className="text-muted-foreground">Ground Speed</span>
					<span>{convertSpeed(trackPoint?.groundspeed ?? pilot.groundspeed, speedUnit, true)}</span>
				</div>
				<div className="flex flex-col">
					<span className="text-muted-foreground">Vertical Speed</span>
					<span>{convertVerticalSpeed(Math.round((trackPoint?.vertical_speed ?? pilot.vertical_speed) / 50) * 50, verticalSpeedUnit)}</span>
				</div>
				<div className="flex flex-col">
					<span className="text-muted-foreground">Track</span>
					<span>{`${hdg}°`}</span>
				</div>
				<div className="flex flex-col">
					<span className="text-muted-foreground">Altimeter</span>
					<span>{`${pilot.qnh_mb} hPa / ${pilot.qnh_i_hg} inHg`}</span>
				</div>
			</AccordionContent>
		</AccordionItem>
	);
}
