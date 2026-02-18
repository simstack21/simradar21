"use client";

import type { StaticAircraft } from "@sr24/types/db";
import { ChevronRightIcon } from "lucide-react";
import useSWR from "swr";
import { AvatarCountry } from "@/components/shared/Avatar";
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/components/ui/item";
import { Separator } from "@/components/ui/separator";
import { fetchApi } from "@/lib/api";

export default function Aircraft({ registration }: { registration: string }) {
	const { data: aircraftData } = useSWR<StaticAircraft>(`/data/aircraft/${registration}`, fetchApi, {
		revalidateIfStale: false,
		revalidateOnFocus: false,
		revalidateOnReconnect: false,
		shouldRetryOnError: false,
	});

	const acType = `${aircraftData?.manufacturerName || ""} ${aircraftData?.model || ""}`;

	if (!aircraftData) {
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
				<a
					href={`https://www.flightradar24.com/data/aircraft/${aircraftData.registration || ""}`}
					target="_blank"
					rel="noopener noreferrer"
					className="text-foreground"
				>
					<ItemContent className="gap-y-2">
						<div className="flex gap-2 items-center">
							<AvatarCountry country={aircraftData.country} />
							<div className="flex flex-col gap-1">
								<span className="font-medium">{registration}</span>
								<span className="text-muted-foreground text-xs">{acType.trim()}</span>
							</div>
						</div>
						<Separator />
						<div className="flex items-center gap-4">
							{aircraftData.owner && (
								<div className="flex flex-col gap-1">
									<span className="font-medium">Owner</span>
									<span className="text-muted-foreground text-xs">{aircraftData.owner}</span>
								</div>
							)}
							{aircraftData.serialNumber && (
								<div className="flex flex-col gap-1">
									<span className="font-medium">Serial Number</span>
									<span className="text-muted-foreground text-xs">{aircraftData.serialNumber}</span>
								</div>
							)}
							{aircraftData.icao24 && (
								<div className="flex flex-col gap-1">
									<span className="font-medium">ICAO24</span>
									<span className="text-muted-foreground text-xs">{aircraftData.icao24}</span>
								</div>
							)}
							{aircraftData.selCal && (
								<div className="flex flex-col gap-1">
									<span className="font-medium">SELCAL</span>
									<span className="text-muted-foreground text-xs">{aircraftData.selCal}</span>
								</div>
							)}
						</div>
						<span className="mt-1">View on Flightradar24</span>
					</ItemContent>
					<ItemActions>
						<ChevronRightIcon className="size-4" />
					</ItemActions>
				</a>
			}
		/>
	);
}
