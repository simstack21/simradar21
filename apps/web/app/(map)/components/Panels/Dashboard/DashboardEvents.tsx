import type { VatsimEvent } from "@sr24/types/vatsim";
import { CalendarFoldIcon, ExternalLinkIcon, PlusIcon, ScanEyeIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { mapService } from "@/app/(map)/lib";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { convertTime } from "@/lib/helpers";
import { useDashboardStore, useSettingsStore } from "@/storage/zustand";

export function DashboardEvents({ events }: { events: VatsimEvent[] }) {
	const { eventsToday, eventsTomorrow, setEventsToday, setEventsTomorrow } = useDashboardStore();
	const [selected, setSelected] = useState<number | null>(null);

	return (
		<AccordionItem
			value="events"
			className="overflow-hidden flex flex-col has-focus-visible:border-ring has-focus-visible:ring-ring/50 outline-none first:rounded-t-md last:rounded-b-md has-focus-visible:z-10 has-focus-visible:ring-[3px]"
		>
			<AccordionTrigger className="items-center">
				<div className="flex items-center gap-4">
					<CalendarFoldIcon className="size-4 shrink-0" />
					<span>Upcoming Events</span>
				</div>
			</AccordionTrigger>
			<ScrollArea className="max-h-full overflow-hidden flex flex-col">
				<AccordionContent className="p-0">
					<Collapsible open={eventsToday} onOpenChange={setEventsToday}>
						<Events events={events} day="today" selected={selected} setSelected={setSelected} />
					</Collapsible>
					<Collapsible open={eventsTomorrow} onOpenChange={setEventsTomorrow}>
						<Events events={events} day="tomorrow" selected={selected} setSelected={setSelected} />
					</Collapsible>
				</AccordionContent>
				<ScrollBar />
			</ScrollArea>
		</AccordionItem>
	);
}

function getDurationString(start: string, end: string, timeFormat: "12h" | "24h", timeZone: "utc" | "local"): string {
	const startDate = new Date(start);
	const endDate = new Date(end);

	const startDay = String(startDate.getUTCDate()).padStart(2, "0");
	const startMonth = String(startDate.getUTCMonth() + 1).padStart(2, "0");

	return `${startDay}.${startMonth} ${convertTime(startDate, timeFormat, timeZone, false)} - ${convertTime(endDate, timeFormat, timeZone, true)}`;
}

function getActiveStatus(start: string, end: string): boolean {
	const now = Date.now();
	const startTime = Date.parse(start);
	const endTime = Date.parse(end);

	return startTime <= now && now < endTime;
}

function Events({
	events,
	day,
	selected,
	setSelected,
}: {
	events: VatsimEvent[];
	day: "today" | "tomorrow";
	selected: number | null;
	setSelected: React.Dispatch<React.SetStateAction<number | null>>;
}) {
	const { timeZone, timeFormat } = useSettingsStore();

	const todaysEvents = useMemo(
		() =>
			events.filter((event) => {
				const eventDate = new Date(event.start_time);
				const dayFilter = new Date(day === "today" ? Date.now() : Date.now() + 86400000);
				return (
					eventDate.getDate() === dayFilter.getDate() &&
					eventDate.getMonth() === dayFilter.getMonth() &&
					eventDate.getFullYear() === dayFilter.getFullYear()
				);
			}),
		[events, day],
	);

	return (
		<>
			<CollapsibleTrigger className="flex w-full items-center gap-4 py-2 font-medium [&[data-panel-open]>svg]:rotate-135">
				<PlusIcon className="text-muted-foreground size-4 shrink-0 transition-transform duration-200" />
				<span>{day === "today" ? "Today's Events" : "Tomorrow's Events"}</span>
			</CollapsibleTrigger>
			<CollapsibleContent className="flex flex-col gap-1">
				{todaysEvents.length === 0 ? (
					<span className="text-center p-2">{`No events scheduled for ${day}.`}</span>
				) : (
					todaysEvents.map((event) => (
						<div key={event.id} className="flex gap-2 items-center justify-between">
							<div className="flex flex-col overflow-hidden">
								<div className="flex items-center gap-2 font-bold overflow-hidden">
									{getActiveStatus(event.start_time, event.end_time) && <span className="h-2 w-2 bg-green rounded-xs animate-pulse shrink-0" />}
									<span className="whitespace-nowrap overflow-hidden text-ellipsis">{event.name}</span>
								</div>
								<div className="whitespace-nowrap overflow-hidden text-ellipsis">{event.airports.map((airport) => airport.icao).join(", ")}</div>
								<div className="text-muted-foreground">{getDurationString(event.start_time, event.end_time, timeFormat, timeZone)}</div>
							</div>
							<div className="inline-flex rounded-md">
								<Link href={event.link} target="_blank" rel="noreferrer">
									<Button size="icon" className="rounded-none rounded-l-md focus-visible:z-10">
										<ExternalLinkIcon />
										<span className="sr-only">External Link</span>
									</Button>
								</Link>
								<Button
									size="icon"
									variant={selected === event.id ? "destructive" : "default"}
									className="rounded-none rounded-r-md focus-visible:z-10"
									onClick={() => {
										if (selected === event.id) {
											setSelected(null);
											mapService.unfocusFeatures();
										} else {
											setSelected(event.id);
											mapService.focusFeatures({ airports: event.airports.map((airport) => airport.icao), hideLayers: ["pilot", "controller"] });
											mapService.fitFeatures({ airports: event.airports.map((airport) => airport.icao), rememberView: false });
										}
									}}
								>
									{selected === event.id ? <XIcon /> : <ScanEyeIcon />}
									<span className="sr-only">{selected === event.id ? "Deselect Event" : "Select Event"}</span>
								</Button>
							</div>
						</div>
					))
				)}
			</CollapsibleContent>
		</>
	);
}
