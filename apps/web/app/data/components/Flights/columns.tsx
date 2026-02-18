"use client";

import type { StaticAirline, StaticAirport } from "@sr24/types/db";
import type { ColumnDef } from "@tanstack/react-table";
import { CheckIcon, LocateIcon, MoreHorizontalIcon, ShareIcon, VideoIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AvatarAirline } from "@/components/shared/Avatar";
import { BadgePilotStatus } from "@/components/shared/Badge";
import { DataTableColumnHeader } from "@/components/shared/Table";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { convertTime } from "@/lib/helpers";
import { getCachedAirline, getCachedAirport } from "@/storage/cache";
import { useSettingsStore } from "@/storage/zustand";
import type { Flight } from "../../types/table";

export const columns: ColumnDef<Flight>[] = [
	{
		accessorKey: "date",
		header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
		cell: ({ row }) => {
			const date = row.getValue("date") as number | undefined;
			if (!date) return <div>N/A</div>;

			const formatted = new Date(date).toLocaleString("en-US", {
				month: "short",
				day: "numeric",
				year: "2-digit",
			});
			return <div className="font-medium">{formatted}</div>;
		},
	},
	{
		accessorKey: "callsign",
		header: ({ column }) => <DataTableColumnHeader column={column} title="Callsign" />,
		cell: ({ row }) => {
			const callsign = row.getValue("callsign") as string;
			return <Airline callsign={callsign} />;
		},
	},
	{
		accessorKey: "departure",
		header: ({ column }) => <DataTableColumnHeader column={column} title="Departure" />,
		cell: ({ row }) => {
			const icao = row.getValue("departure") as string | undefined;
			return <Airport icao={icao} />;
		},
	},
	{
		accessorKey: "arrival",
		header: ({ column }) => <DataTableColumnHeader column={column} title="Arrival" />,
		cell: ({ row }) => {
			const icao = row.getValue("arrival") as string | undefined;
			return <Airport icao={icao} />;
		},
	},
	{
		accessorKey: "aircraft",
		header: ({ column }) => <DataTableColumnHeader column={column} title="Aircraft" />,
		cell: ({ row }) => {
			const flight = row.original;

			if (!flight.registration) {
				return <span>{flight.aircraft}</span>;
			}

			return (
				<div className="flex gap-2">
					<span>{flight.aircraft}</span>
					<Link href={`/data/aircrafts/${flight.registration}`}>{flight.registration}</Link>
				</div>
			);
		},
	},
	{
		accessorKey: "flight_time",
		header: "Flight Time",
		cell: ({ row }) => {
			const flight = row.original;
			const flightTime = calculateFlightTime(flight.atd, flight.ata);
			return <div>{flightTime}</div>;
		},
	},
	{
		accessorKey: "status",
		header: "Status",
		cell: ({ row }) => {
			const status = row.getValue("status") as Flight["status"];
			return <BadgePilotStatus status={status} />;
		},
	},
	{
		accessorKey: "std",
		header: "STD",
		cell: ({ row }) => {
			const { timeZone } = useSettingsStore();
			const std = row.getValue("std") as number | undefined;
			return <div>{convertTime(std, "24h", timeZone)}</div>;
		},
	},
	{
		accessorKey: "atd",
		header: "ATD",
		cell: ({ row }) => {
			const { timeZone } = useSettingsStore();
			const std = row.getValue("atd") as number | undefined;
			return <div>{convertTime(std, "24h", timeZone)}</div>;
		},
	},
	{
		accessorKey: "sta",
		header: "STA",
		cell: ({ row }) => {
			const { timeZone } = useSettingsStore();
			const std = row.getValue("sta") as number | undefined;
			return <div>{convertTime(std, "24h", timeZone)}</div>;
		},
	},
	{
		accessorKey: "ata",
		header: "ATA",
		cell: ({ row }) => {
			const { timeZone } = useSettingsStore();
			const std = row.getValue("ata") as number | undefined;
			return <div>{convertTime(std, "24h", timeZone)}</div>;
		},
	},
	{
		id: "actions",
		cell: ({ row }) => {
			const router = useRouter();
			const pathname = usePathname();
			const flight = row.original;

			return (
				<DropdownMenu>
					<DropdownMenuTrigger
						openOnHover
						render={
							<Button variant="ghost" className="h-8 w-8 p-0">
								<span className="sr-only">Open menu</span>
								<MoreHorizontalIcon className="h-4 w-4" />
							</Button>
						}
					></DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuGroup>
							<DropdownMenuLabel>Actions</DropdownMenuLabel>
							<ShareButton flight={flight} />
							{flight.status === "live" && (
								<DropdownMenuItem onClick={() => window.location.assign(`/pilot/${flight.id}`)}>
									<LocateIcon /> Watch Live
								</DropdownMenuItem>
							)}
							{flight.status === "off" && (
								<DropdownMenuItem
									onClick={() => {
										const base = pathname.replace(/\/$/, "");
										router.push(`${base}/${flight.id}`);
									}}
								>
									<VideoIcon /> Watch Replay
								</DropdownMenuItem>
							)}
						</DropdownMenuGroup>
					</DropdownMenuContent>
				</DropdownMenu>
			);
		},
	},
];

function calculateFlightTime(off_block: number | undefined, on_block: number | undefined): string {
	if (!off_block || !on_block) return "N/A";

	const offBlockTime = new Date(off_block);
	const onBlockTime = new Date(on_block);
	const diffMs = onBlockTime.getTime() - offBlockTime.getTime();
	const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
	const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

	return `${diffHours}h ${diffMinutes}m`;
}

function ShareButton({ flight }: { flight: Flight }) {
	const [shared, setShared] = useState(false);

	const onShareClick = () => {
		if (typeof window === "undefined") return;

		navigator.clipboard.writeText(`${window.location.origin}/data/flights/${flight.callsign}/${flight.id}`);
		toast.success("Replay Link Copied to Clipboard!");
		setShared(true);
		setTimeout(() => setShared(false), 2000);
	};

	return (
		<DropdownMenuItem onClick={onShareClick} closeOnClick={false}>
			{shared ? <CheckIcon className="text-green" /> : <ShareIcon />}
			<span>{shared ? "Link Copied!" : "Share Replay"}</span>
		</DropdownMenuItem>
	);
}

function Airport({ icao }: { icao: string | undefined }) {
	const [airport, setAirport] = useState<StaticAirport | null>(null);

	useEffect(() => {
		if (!icao) return;
		getCachedAirport(icao).then(setAirport);
	}, [icao]);

	if (!icao) return <span>N/A</span>;
	if (!airport) return <span>Loading...</span>;

	return (
		<div className="flex gap-2">
			<span>{airport.city}</span>
			<a href={`/airport/${airport.id}`}>{airport.id}</a>
		</div>
	);
}

function Airline({ callsign }: { callsign: string }) {
	const [airline, setAirline] = useState<StaticAirline | null>(null);

	useEffect(() => {
		if (!callsign) return;
		const airlineCode = callsign.slice(0, 3).toUpperCase();
		getCachedAirline(airlineCode).then(setAirline);
	}, [callsign]);

	return (
		<div className="flex gap-2 items-center">
			<AvatarAirline airline={airline} />
			<Link href={`/data/flights/${callsign}`}>{callsign}</Link>
		</div>
	);
}
