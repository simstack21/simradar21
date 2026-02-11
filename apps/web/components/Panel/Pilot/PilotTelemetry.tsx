import type { PilotLong, TrackPoint } from "@sr24/types/interface";
import { GaugeIcon } from "lucide-react";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { convertAltitude, convertSpeed, convertVerticalSpeed } from "@/lib/helpers";
import { useSettingsStore } from "@/storage/zustand";

export function PilotTelemetry({ pilot, trackPoint }: { pilot: PilotLong; trackPoint?: TrackPoint }) {
	const { altitudeUnit, speedUnit, verticalSpeedUnit } = useSettingsStore();

	let hdg = String(trackPoint?.heading ?? pilot.heading);
	if (hdg.length === 1) {
		hdg = `00${hdg}`;
	}
	if (hdg.length === 2) {
		hdg = `0${hdg}`;
	}

	return (
		<AccordionItem
			value="telemetry"
			className="overflow-hidden flex flex-col has-focus-visible:border-ring has-focus-visible:ring-ring/50 outline-none has-focus-visible:z-10 has-focus-visible:ring-[3px]"
		>
			<AccordionTrigger className="items-center data-panel-open:bg-muted">
				<div className="flex items-center gap-4">
					<GaugeIcon className="size-4 shrink-0" />
					<span>Telemetry</span>
				</div>
			</AccordionTrigger>
			<AccordionContent className="py-1 grid grid-cols-2 gap-1">
				<div className="flex flex-col">
					<span className="text-muted-foreground">Barometric Altitude</span>
					<span>{convertAltitude(Math.round((trackPoint?.altitude_ms ?? pilot.altitude_ms) / 250) * 250, altitudeUnit, true)}</span>
				</div>
				<div className="flex flex-col">
					<span className="text-muted-foreground">Radar Altitude</span>
					<span>{convertAltitude(Math.round((trackPoint?.altitude_agl ?? pilot.altitude_agl) / 250) * 250, altitudeUnit, true)}</span>
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
