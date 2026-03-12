import type { StaticAircraft, StaticAircraftImg } from "@sr24/types/db";
import type { PilotLong } from "@sr24/types/interface";
import { ArrowRightIcon, ChevronLeftIcon, ChevronRightIcon, PlaneIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { AvatarCountry } from "@/components/shared/Avatar";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { fetchApi } from "@/lib/api";
import { cn } from "@/lib/utils";

export function PilotAircraft({ pilot }: { pilot: PilotLong }) {
	const { data: aircraftData } = useSWR<StaticAircraft>(`/data/aircraft/${pilot.flight_plan?.ac_reg}`, fetchApi, {
		revalidateIfStale: false,
		revalidateOnFocus: false,
		revalidateOnReconnect: false,
		shouldRetryOnError: false,
	});

	const acType = `${aircraftData?.manufacturerName || ""} ${aircraftData?.model || ""}`;

	return (
		<AccordionItem value="aircraft" className="overflow-hidden flex flex-col">
			<AccordionTrigger className="items-center data-panel-open:bg-muted">
				<div className="flex items-center gap-4">
					<PlaneIcon className="size-4 shrink-0" />
					<span>Aircraft</span>
				</div>
			</AccordionTrigger>
			<AccordionContent className="py-1 grid grid-cols-2 gap-1">
				{aircraftData?.imgs && aircraftData?.imgs.length > 0 && <AircraftImageCarousel imgs={aircraftData.imgs} />}
				{aircraftData && (
					<div className="flex gap-2 items-center col-span-2">
						<AvatarCountry country={aircraftData.country} size="sm" />
						<div className="flex flex-col">
							<span className="text-muted-foreground">Aircraft Type</span>
							<span>{acType.trim() ? acType : pilot.aircraft}</span>
						</div>
					</div>
				)}
				{!aircraftData && (
					<div className="flex flex-col">
						<span className="text-muted-foreground">Aircraft Type</span>
						<span>{acType.trim() ? acType : pilot.aircraft}</span>
					</div>
				)}
				{!aircraftData && pilot.flight_plan?.ac_reg && (
					<div className="flex flex-col">
						<span className="text-muted-foreground">Registration</span>
						<span>{pilot.flight_plan?.ac_reg}</span>
					</div>
				)}
				{aircraftData && (
					<>
						<div className="flex flex-col col-span-2">
							<span className="text-muted-foreground">Owner</span>
							<span>{aircraftData.owner || "N/A"}</span>
						</div>
						<div className="flex flex-col">
							<span className="text-muted-foreground">Registration</span>
							<span>{pilot.flight_plan?.ac_reg}</span>
						</div>
						<div className="flex flex-col">
							<span className="text-muted-foreground">Serial Number (MSN)</span>
							<span>{aircraftData.serialNumber || "N/A"}</span>
						</div>
						<div className="flex flex-col">
							<span className="text-muted-foreground">ICAO24</span>
							<span>{aircraftData.icao24 || "N/A"}</span>
						</div>
						<div className="flex flex-col">
							<span className="text-muted-foreground">SELCAL</span>
							<span>{aircraftData.selCal || "N/A"}</span>
						</div>
						<a href={`/data/aircrafts/${pilot.flight_plan?.ac_reg}`} className="flex col-span-2 items-center group gap-1">
							View more flights of {pilot.flight_plan?.ac_reg}
							<ArrowRightIcon className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
						</a>
					</>
				)}
			</AccordionContent>
		</AccordionItem>
	);
}

function AircraftImageCarousel({ imgs }: { imgs: StaticAircraftImg[] }) {
	const [index, setIndex] = useState(0);

	const prev = () => setIndex((i) => (i - 1 + imgs.length) % imgs.length);
	const next = () => setIndex((i) => (i + 1) % imgs.length);

	return (
		<div className="relative w-full col-span-2 rounded-md overflow-hidden bg-muted group mt-1">
			<div className="flex transition-transform duration-300 ease-in-out" style={{ transform: `translateX(-${index * 100}%)` }}>
				{imgs.map((img) => (
					<div key={img.id} className="w-full shrink-0">
						<AircraftImage img={img} />
					</div>
				))}
			</div>

			{imgs.length > 1 && (
				<div className="absolute bottom-0 p-1 flex items-center justify-center w-full">
					{index > 0 && (
						<Button variant="outline" size="icon-sm" className="opacity-0 group-hover:opacity-100 transition-opacity mr-auto" onClick={prev}>
							<ChevronLeftIcon />
						</Button>
					)}
					{index < imgs.length - 1 && (
						<Button variant="outline" size="icon-sm" className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto" onClick={next}>
							<ChevronRightIcon />
						</Button>
					)}
					<div className="absolute bottom-2 flex gap-1">
						{imgs.map((img, i) => (
							<button
								type="button"
								key={img.id}
								onClick={() => setIndex(i)}
								className={cn("size-2 rounded-full transition-colors hover:bg-white", i === index ? "bg-white" : "bg-white/40")}
							/>
						))}
					</div>
				</div>
			)}
		</div>
	);
}

function AircraftImage({ img }: { img: StaticAircraftImg }) {
	return (
		<div className="relative">
			<Image src={img.imgUrl} alt={`Photo by ${img.photographer}`} width={img.width} height={img.height} className="object-cover" />
			<Link
				href={img.link}
				target="_blank"
				className="absolute right-1.5 top-1.5 bg-muted rounded-sm px-1.5 py-0.5 no-underline! text-muted-foreground text-xs"
			>
				{`© ${img.photographer}`}
			</Link>
		</div>
	);
}
