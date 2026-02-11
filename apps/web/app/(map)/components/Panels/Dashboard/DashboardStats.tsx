import type { DashboardStats as Stats } from "@sr24/types/interface";
import { NotepadTextIcon, PlaneLandingIcon, PlaneTakeoffIcon, ScanEyeIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function DashboardStats({ stats }: { stats: Stats }) {
	const [openTab, setOpenTab] = useState<"airports" | "routes" | "aircrafts" | "controllers">("airports");

	return (
		<AccordionItem
			value="statistics"
			className="has-focus-visible:border-ring has-focus-visible:ring-ring/50 outline-none first:rounded-t-md last:rounded-b-md has-focus-visible:z-10 has-focus-visible:ring-[3px]"
		>
			<AccordionTrigger className="items-center data-panel-open:bg-muted">
				<div className="flex items-center gap-4">
					<NotepadTextIcon className="size-4 shrink-0" />
					<span>General Statistics</span>
				</div>
			</AccordionTrigger>
			<AccordionContent className="py-1 flex flex-col gap-y-2">
				<div className="flex gap-x-1 flex-wrap justify-between">
					<div className="flex gap-1">
						<span className="text-muted-foreground">All</span>
						<span>{stats.pilots + stats.controllers + stats.supervisors}</span>
					</div>
					<div className="flex gap-1">
						<span className="text-muted-foreground">Pilots</span>
						<span>{stats.pilots}</span>
					</div>
					<div className="flex gap-1">
						<span className="text-muted-foreground">Controllers</span>
						<span>{stats.controllers}</span>
					</div>
					<div className="flex gap-1">
						<span className="text-muted-foreground">Supervisors</span>
						<span>{stats.supervisors}</span>
					</div>
				</div>
				<Tabs value={openTab} onValueChange={setOpenTab} className="flex flex-col gap-1">
					<TabsList className="w-full">
						<TabsTrigger value="airports">Airports</TabsTrigger>
						<TabsTrigger value="routes">Routes</TabsTrigger>
						<TabsTrigger value="aircrafts">Aircrafts</TabsTrigger>
						<TabsTrigger value="controllers">Controllers</TabsTrigger>
					</TabsList>
					{openTab === "airports" && <AirportStats stats={stats} />}
					{openTab === "routes" && <RouteStats stats={stats} />}
					{openTab === "aircrafts" && <AircraftStats stats={stats} />}
					{openTab === "controllers" && <ControllerStats stats={stats} />}
				</Tabs>
			</AccordionContent>
		</AccordionItem>
	);
}

function AirportStats({ stats }: { stats: Stats }) {
	const router = useRouter();

	return (
		<TabsContent value="airports">
			<div className="text-center text-muted-foreground mb-1">Busiest Airports</div>
			<Table>
				<TableHeader className="bg-muted/50">
					<TableRow>
						<TableHead className="h-8 p-1.5">#</TableHead>
						<TableHead className="h-8 p-1.5">Airport</TableHead>
						<TableHead className="h-8 p-1.5">
							<PlaneTakeoffIcon size={16} />
						</TableHead>
						<TableHead className="h-8 p-1.5">
							<PlaneLandingIcon size={16} />
						</TableHead>
						<TableHead className="h-8 p-1.5 text-right w-20">View on Map</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{stats.busiestAirports.map((airport, i) => (
						<TableRow key={airport.icao}>
							<TableCell className="font-bold p-1.5">{i + 1}</TableCell>
							<TableCell className="p-1.5">{airport.icao}</TableCell>
							<TableCell className="p-1.5">{airport.departures}</TableCell>
							<TableCell className="p-1.5">{airport.arrivals}</TableCell>
							<TableCell className="px-1.5 py-0.5 flex items-center justify-end">
								<Button variant="outline" size="icon-sm" onClick={() => router.push(`/airport/${airport.icao}`)}>
									<ScanEyeIcon size={16} />
									<span className="sr-only">View Airport</span>
								</Button>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
			{/* <div className="text-center text-muted-foreground mb-1">Quietest Airports</div>
			<Table>
				<TableHeader className="bg-muted/50">
					<TableRow>
						<TableHead className="h-8 p-1.5">#</TableHead>
						<TableHead className="h-8 p-1.5">Airport</TableHead>
						<TableHead className="h-8 p-1.5">
							<PlaneTakeoffIcon size={16} />
						</TableHead>
						<TableHead className="h-8 p-1.5">
							<PlaneLandingIcon size={16} />
						</TableHead>
						<TableHead className="h-8 p-1.5 text-right w-20">View on Map</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{stats.quietestAirports.map((airport, i) => (
						<TableRow key={airport.icao}>
							<TableCell className="font-bold p-1.5">{i + 1}</TableCell>
							<TableCell className="p-1.5">{airport.icao}</TableCell>
							<TableCell className="p-1.5">{airport.departures}</TableCell>
							<TableCell className="p-1.5">{airport.arrivals}</TableCell>
							<TableCell className="px-1.5 py-0.5 flex items-center justify-end" onClick={() => router.push(`/airport/${airport.icao}`)}>
								<Button variant="outline" size="icon-sm">
									<ScanEyeIcon size={16} />
									<span className="sr-only">View Airport</span>
								</Button>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table> */}
		</TabsContent>
	);
}

function RouteStats({ stats }: { stats: Stats }) {
	return (
		<TabsContent value="routes">
			<div className="text-center text-muted-foreground mb-1">Busiest Routes</div>
			<Table>
				<TableHeader className="bg-muted/50">
					<TableRow>
						<TableHead className="h-8 p-1.5">#</TableHead>
						<TableHead className="h-8 p-1.5">
							<PlaneTakeoffIcon size={16} />
						</TableHead>
						<TableHead className="h-8 p-1.5">
							<PlaneLandingIcon size={16} />
						</TableHead>
						<TableHead className="h-8 p-1.5 text-right">Flights</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{stats.busiestRoutes.map((route, i) => (
						<TableRow key={`${route.departure}-${route.arrival}`}>
							<TableCell className="font-bold p-1.5">{i + 1}</TableCell>
							<TableCell className="p-1.5">{route.departure}</TableCell>
							<TableCell className="p-1.5">{route.arrival}</TableCell>
							<TableCell className="p-1.5 text-right">{route.count}</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
			{/* <div className="text-center text-muted-foreground mb-1">Quietest Routes</div>
			<Table>
				<TableHeader className="bg-muted/50">
					<TableRow>
						<TableHead className="h-8 p-1.5">#</TableHead>
						<TableHead className="h-8 p-1.5">
							<PlaneTakeoffIcon size={16} />
						</TableHead>
						<TableHead className="h-8 p-1.5">
							<PlaneLandingIcon size={16} />
						</TableHead>
						<TableHead className="h-8 p-1.5 text-right">Flights</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{stats.quietestRoutes.map((route, i) => (
						<TableRow key={`${route.departure}-${route.arrival}`}>
							<TableCell className="font-bold p-1.5">{i + 1}</TableCell>
							<TableCell className="p-1.5">{route.departure}</TableCell>
							<TableCell className="p-1.5">{route.arrival}</TableCell>
							<TableCell className="p-1.5 text-right">{route.count}</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table> */}
		</TabsContent>
	);
}

function AircraftStats({ stats }: { stats: Stats }) {
	return (
		<TabsContent value="aircrafts">
			<div className="text-center text-muted-foreground mb-1">Most Flown Aircraft</div>
			<Table>
				<TableHeader className="bg-muted/50">
					<TableRow>
						<TableHead className="h-8 p-1.5">#</TableHead>
						<TableHead className="h-8 p-1.5">Aircraft</TableHead>
						<TableHead className="h-8 p-1.5 text-right">Flights</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{stats.busiestAircrafts.map((aircraft, i) => (
						<TableRow key={aircraft.aircraft}>
							<TableCell className="font-bold p-1.5">{i + 1}</TableCell>
							<TableCell className="p-1.5">{aircraft.aircraft}</TableCell>
							<TableCell className="p-1.5 text-right">{aircraft.count}</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</TabsContent>
	);
}

function ControllerStats({ stats }: { stats: Stats }) {
	return (
		<TabsContent value="controllers">
			<div className="text-center text-muted-foreground mb-1">Busiest Controllers</div>
			<Table>
				<TableHeader className="bg-muted/50">
					<TableRow>
						<TableHead className="h-8 p-1.5">#</TableHead>
						<TableHead className="h-8 p-1.5">Controller</TableHead>
						<TableHead className="h-8 p-1.5 text-right">Connections</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{stats.busiestControllers.map((controller, i) => (
						<TableRow key={controller.callsign}>
							<TableCell className="font-bold p-1.5">{i + 1}</TableCell>
							<TableCell className="p-1.5">{controller.callsign}</TableCell>
							<TableCell className="p-1.5 text-right">{controller.count}</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</TabsContent>
	);
}
