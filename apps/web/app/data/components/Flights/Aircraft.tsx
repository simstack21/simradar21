"use client";

import type { StaticAircraft } from "@sr24/types/db";
import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AvatarCountry } from "@/components/shared/Avatar";
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/components/ui/item";
import { Separator } from "@/components/ui/separator";
import { getCachedAircraft } from "@/storage/cache";

export default function Aircraft({ registration }: { registration: string }) {
	const [aircraft, setAircraft] = useState<StaticAircraft | null>(null);

	useEffect(() => {
		getCachedAircraft(registration).then(setAircraft);
	}, [registration]);

	const acType = `${aircraft?.manufacturerName || ""} ${aircraft?.model || ""}`;

	if (!aircraft) {
		return (
			<Item className="ml-auto w-fit min-w-60" variant="outline">
				<ItemMedia>
					<AvatarCountry country={"unknown"} />
				</ItemMedia>
				<ItemContent>
					<ItemTitle>{registration}</ItemTitle>
					<ItemDescription className="flex gap-1">Unknown</ItemDescription>
				</ItemContent>
			</Item>
		);
	}

	return (
		<Item
			className="ml-auto w-full md:w-fit min-w-60"
			variant="outline"
			render={
				<Link
					href={`https://www.flightradar24.com/data/aircraft/${aircraft.registration || ""}`}
					target="_blank"
					rel="noopener noreferrer"
					className="text-foreground"
				>
					<ItemContent className="gap-y-2">
						<div className="flex gap-2 items-center">
							<AvatarCountry country={aircraft.country} />
							<div className="flex flex-col gap-1">
								<span className="font-medium">{registration}</span>
								<span className="text-muted-foreground text-xs">{acType.trim()}</span>
							</div>
						</div>
						<Separator />
						<div className="flex items-center gap-4">
							{aircraft.owner && (
								<div className="flex flex-col gap-1">
									<span className="font-medium">Owner</span>
									<span className="text-muted-foreground text-xs">{aircraft.owner}</span>
								</div>
							)}
							{aircraft.serialNumber && (
								<div className="flex flex-col gap-1">
									<span className="font-medium">Serial Number</span>
									<span className="text-muted-foreground text-xs">{aircraft.serialNumber}</span>
								</div>
							)}
							{aircraft.icao24 && (
								<div className="flex flex-col gap-1">
									<span className="font-medium">ICAO24</span>
									<span className="text-muted-foreground text-xs">{aircraft.icao24}</span>
								</div>
							)}
							{aircraft.selCal && (
								<div className="flex flex-col gap-1">
									<span className="font-medium">SelCal</span>
									<span className="text-muted-foreground text-xs">{aircraft.selCal}</span>
								</div>
							)}
						</div>
						<span className="mt-1">View on Flightradar24</span>
					</ItemContent>
					<ItemActions>
						<ChevronRightIcon className="size-4" />
					</ItemActions>
				</Link>
			}
		/>
	);
}
