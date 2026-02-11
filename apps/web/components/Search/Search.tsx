import type { StaticAirline, StaticAirport } from "@sr24/types/db";
import type { PilotLong } from "@sr24/types/interface";
import { useQuery } from "@tanstack/react-query";
import {
	CircleXIcon,
	HistoryIcon,
	LoaderCircleIcon,
	PlaneIcon,
	RouteIcon,
	SearchIcon,
	TicketsPlane,
	TowerControl,
	UserIcon,
	XIcon,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { useDebounce } from "use-debounce";
import { Button } from "@/components/ui/button";
import { Command, CommandDialog, CommandGroup, CommandItem, CommandList, CommandSeparator, CommandShortcut } from "@/components/ui/command";
import { getCachedAirline } from "@/storage/cache";
import { dxFindAirlines, dxFindAirports } from "@/storage/dexie";
import { AvatarAirline, AvatarCountry } from "../shared/Avatar";
import { BadgeFeatureHelp, BadgePilotStatus } from "../shared/Badge";
import { Input } from "../ui/input";
import { Kbd } from "../ui/kbd";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger } from "../ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { addSearchHistory, fetchPilots, getPilotMatchFields, getSearchHistory, highlightMatch, removeSearchHistory } from "./helpers";
import type { FilterItem, HistoryItem, QueryResult } from "./types";

const filterList: FilterItem[] = [
	{ value: "All", icon: SearchIcon, placeholder: "Type at least 3 characters..." },
	{ value: "Flights", icon: PlaneIcon, placeholder: "e.g. AAL123 or DLH443..." },
	{ value: "Airports", icon: TowerControl, placeholder: "e.g. EDDF or Frankfurt..." },
	{ value: "Airlines", icon: TicketsPlane, placeholder: "e.g. DLH or Lufthansa..." },
	{ value: "Routes", icon: RouteIcon, placeholder: "e.g. KJFK-EDDF..." },
	{ value: "Users", icon: UserIcon, placeholder: "e.g. CID or name..." },
];

export function CommandSearch() {
	const id = useId();

	const [open, setOpen] = useState(false);
	const [searchValue, setSearchValue] = useState("");
	const [history, setHistory] = useState<HistoryItem[]>([]);
	const [selectValue, setSelectValue] = useState<FilterItem["value"] | null>("All");

	const debounced = useDebounce(searchValue, 300);

	const { data, isLoading } = useQuery<QueryResult>({
		queryKey: ["search", debounced, selectValue],
		queryFn: async () => {
			if (selectValue === "Flights") {
				const pilots = await fetchPilots(debounced[0]);
				return { pilots };
			}
			if (selectValue === "Airlines") {
				const airlines = await dxFindAirlines(debounced[0], 10);
				return { airlines };
			}
			if (selectValue === "Airports") {
				const airports = await dxFindAirports(debounced[0], 10);
				return { airports };
			}
			if (selectValue === "Routes") {
				const pilots = await fetchPilots(debounced[0], "routes");
				return { pilots };
			}
			if (selectValue === "Users") {
				const pilots = await fetchPilots(debounced[0], "users");
				return { pilots };
			}
			const [airlines, airports, pilots] = await Promise.all([
				dxFindAirlines(debounced[0], 10),
				dxFindAirports(debounced[0], 10),
				fetchPilots(debounced[0]),
			]);
			return { airlines, airports, pilots };
		},
		enabled: debounced[0].length > 2,
		staleTime: 10_000,
		gcTime: 60_000,
		retry: false,
	});

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.code === "Space" && document.activeElement?.tagName !== "INPUT") {
				e.preventDefault();
				setOpen(true);
			}
		};

		setHistory(getSearchHistory());

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);

	const onSelectItem = (type: FilterItem["value"], value: string, close?: boolean) => {
		setSelectValue(type);
		setSearchValue(value);
		addSearchHistory({ type, value });
		setHistory(getSearchHistory());

		if (close) {
			setOpen(false);
		}
	};

	return (
		<div className="flex flex-col gap-4">
			<Tooltip>
				<TooltipTrigger
					delay={100}
					render={
						<Button variant="ghost" onClick={() => setOpen(true)}>
							<SearchIcon data-icon="inline-start" />
						</Button>
					}
				></TooltipTrigger>
				<TooltipContent className="pr-1.5">
					<div className="flex items-center gap-2">
						Open Search <Kbd>Space</Kbd>
					</div>
				</TooltipContent>
			</Tooltip>
			<CommandDialog open={open} onOpenChange={setOpen}>
				<Command>
					<div className="relative flex p-1">
						<Select
							defaultValue="All"
							value={selectValue}
							onValueChange={(value) => {
								setSelectValue(value);
								setSearchValue("");
							}}
						>
							<SelectTrigger id={id} className="rounded-r-none shadow-none focus-visible:z-10" tabIndex={-1}>
								{(() => {
									const Icon = filterList.find((f) => f.value === selectValue)?.icon ?? SearchIcon;
									return <Icon className="text-green" />;
								})()}
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									<SelectLabel>Filters</SelectLabel>
									{filterList.map((filter) => (
										<SelectItem key={filter.value} value={filter.value}>
											<filter.icon className="my-auto" />
											{filter.value}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>
						<Input
							id={id}
							type="text"
							tabIndex={0}
							placeholder={filterList.find((f) => f.value === selectValue)?.placeholder}
							value={searchValue}
							onChange={(e) => setSearchValue(e.target.value)}
							className="-ms-px rounded-l-none shadow-none peer"
						/>
						{isLoading && (
							<div className="text-muted-foreground pointer-events-none absolute inset-y-0 right-5 flex items-center justify-center pr-3 peer-disabled:opacity-50">
								<LoaderCircleIcon className="size-4 animate-spin" />
								<span className="sr-only">Loading...</span>
							</div>
						)}
						<div
							className="text-muted-foreground absolute inset-y-0 right-0 flex items-center justify-center pr-3 z-20"
							onClick={() => setSearchValue("")}
						>
							<CircleXIcon className="size-4" />
							<span className="sr-only">Clear</span>
						</div>
					</div>
					<CommandList>
						<BadgeFeatureHelp featureKey="search" text="Press Space to open the search window." className="p-1" />
						{searchValue.length < 3 && history.length > 0 && (
							<>
								<CommandSeparator />
								<CommandGroup heading="History">
									{history.map((item) => (
										<CommandItem key={item.value} onSelect={() => onSelectItem(item.type, item.value)}>
											<HistoryIcon />
											<span>{item.value}</span>
											<CommandShortcut
												className="group"
												onClick={(e) => {
													e.stopPropagation();
													removeSearchHistory(item.value);
													setHistory(getSearchHistory());
												}}
											>
												<XIcon className="group-hover:text-red" />
											</CommandShortcut>
										</CommandItem>
									))}
								</CommandGroup>
							</>
						)}
						{data?.pilots?.live && data?.pilots.live.length > 0 && (
							<>
								<CommandSeparator />
								<CommandGroup heading="Live Flights">
									{data?.pilots.live.map((pilot) => (
										<PilotItem key={`${pilot.cid}_live`} pilot={pilot} searchValue={searchValue} onSelectItem={onSelectItem} />
									))}
								</CommandGroup>
							</>
						)}
						{data?.pilots?.offline && data?.pilots.offline.length > 0 && (
							<>
								<CommandSeparator />
								<CommandGroup heading="Recent or Scheduled Flights">
									{data?.pilots.offline.map((pilot) => (
										<PilotItem key={`${pilot.cid}_offline`} pilot={pilot} recent searchValue={searchValue} onSelectItem={onSelectItem} />
									))}
								</CommandGroup>
							</>
						)}
						{data?.airlines && data?.airlines.length > 0 && (
							<>
								<CommandSeparator />
								<CommandGroup heading="Airlines">
									{data?.airlines.map((airline) => (
										<AirlineItem key={airline.id} airline={airline} onSelectItem={onSelectItem} />
									))}
								</CommandGroup>
							</>
						)}
						{data?.airports && data?.airports.length > 0 && (
							<>
								<CommandSeparator />
								<CommandGroup heading="Airports">
									{data?.airports.map((airport) => (
										<AirportItem key={airport.id} airport={airport} onSelectItem={onSelectItem} />
									))}
								</CommandGroup>
							</>
						)}
					</CommandList>
				</Command>
			</CommandDialog>
		</div>
	);
}

function PilotItem({
	pilot,
	recent = false,
	searchValue,
	onSelectItem,
}: {
	pilot: PilotLong;
	recent?: boolean;
	searchValue: string;
	onSelectItem: (type: FilterItem["value"], value: string, close?: boolean) => void;
}) {
	const [airline, setAirline] = useState<StaticAirline | null>(null);
	const router = useRouter();
	const pathname = usePathname();

	useEffect(() => {
		const airlineCode = pilot.callsign.slice(0, 3).toUpperCase();

		(async () => {
			const cached = await getCachedAirline(airlineCode);
			setAirline(cached);
		})();
	}, [pilot]);

	const matchFields = getPilotMatchFields(pilot, searchValue);

	return (
		<CommandItem
			key={`${pilot.cid}_offline`}
			onSelect={() => {
				onSelectItem("Flights", pilot.callsign, true);
				if (pathname.startsWith("/data") && recent) {
					router.push(`/data/flights/${pilot.callsign}`);
					return;
				}
				if (pathname.startsWith("/data") && !recent) {
					window.location.href = `/pilot/${pilot.id}`;
					return;
				}
				if (!pathname.startsWith("/data") && recent) {
					window.location.href = `/data/flights/${pilot.callsign}`;
					return;
				}
				router.push(`/pilot/${pilot.id}`);
			}}
		>
			<AvatarAirline airline={airline} />
			<div className="flex flex-col">
				<div className="flex gap-2">
					<span>{pilot.callsign}</span>
					<BadgePilotStatus status={pilot.live} />
				</div>
				{matchFields.name && (
					<span className="text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis max-w-60">
						Name: {highlightMatch(matchFields.name, searchValue)}
					</span>
				)}
				{matchFields.cid && (
					<span className="text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis max-w-60">
						CID: {highlightMatch(matchFields.cid, searchValue)}
					</span>
				)}
			</div>
			{!recent && (
				<CommandShortcut>
					<div className="flex flex-col items-end">
						<span>{pilot.aircraft}</span>
						<span className="text-xs text-muted-foreground">
							{pilot.flight_plan?.departure.icao} &ndash; {pilot.flight_plan?.arrival.icao}
						</span>
					</div>
				</CommandShortcut>
			)}
		</CommandItem>
	);
}

function AirportItem({
	airport,
	onSelectItem,
}: {
	airport: StaticAirport;
	onSelectItem: (type: FilterItem["value"], value: string, close?: boolean) => void;
}) {
	const router = useRouter();
	const pathname = usePathname();

	return (
		<CommandItem
			key={airport.id}
			onSelect={() => {
				onSelectItem("Airports", airport.id, true);
				if (pathname.startsWith("/data")) {
					window.location.href = `/airport/${airport.id}`;
					return;
				}
				router.push(`/airport/${airport.id}`);
			}}
		>
			<AvatarCountry country={airport.country} />
			<div className="flex flex-col">
				<span>{airport.name}</span>
				<span className="text-muted-foreground">{airport.city}</span>
			</div>
			<CommandShortcut>
				<div className="flex flex-col items-end">
					<span>{airport.id}</span>
					<span className="text-xs text-muted-foreground">{airport.iata}</span>
				</div>
			</CommandShortcut>
		</CommandItem>
	);
}

function AirlineItem({
	airline,
	onSelectItem,
}: {
	airline: StaticAirline;
	onSelectItem: (type: FilterItem["value"], value: string, close?: boolean) => void;
}) {
	return (
		<CommandItem
			key={airline.id}
			onSelect={() => {
				onSelectItem("Flights", airline.id);
			}}
		>
			<AvatarAirline airline={airline} />
			<div className="flex flex-col">
				<span>{airline.name}</span>
				<span className="text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis max-w-60">{airline.callsign}</span>
			</div>
			<CommandShortcut>
				<div className="flex flex-col items-end">
					<span>{airline.id}</span>
					<span className="text-xs text-muted-foreground">{airline.iata}</span>
				</div>
			</CommandShortcut>
		</CommandItem>
	);
}
