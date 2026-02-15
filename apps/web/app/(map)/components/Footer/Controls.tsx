"use client";

import {
	EyeIcon,
	EyeOffIcon,
	FunnelIcon,
	LayersIcon,
	LocateIcon,
	MaximizeIcon,
	MinimizeIcon,
	MinusIcon,
	PlusIcon,
	RefreshCcwDotIcon,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useFiltersStore, useMapPageStore, useMapVisibilityStore } from "@/storage/zustand";
import { mapService } from "../../lib";

export default function Controls() {
	const { isHidden, setHidden } = useMapVisibilityStore();

	return (
		<div className="flex flex-col gap-2">
			<div className="flex items-center justify-center gap-4">
				{!isHidden && <SwitchMultiView />}
				<SwitchVisibility checked={!isHidden} onCheckedChange={(checked) => setHidden(!checked)} />
			</div>
			{!isHidden && <ButtonGroupControls />}
		</div>
	);
}

const SwitchMultiView = () => {
	const id = useId();
	const router = useRouter();
	const pathname = usePathname();

	const isMultiView = pathname.startsWith("/multi");

	return (
		<div className="flex items-center gap-2">
			<Switch id={id} checked={isMultiView} onCheckedChange={(checked) => router.push(checked ? "/multi" : "/")} aria-label="Toggle switch" />
			<Label htmlFor={id}>
				<span className="sr-only">Toggle switch</span>
				{isMultiView ? "Multi View" : "Single View"}
			</Label>
		</div>
	);
};

const SwitchVisibility = ({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (checked: boolean) => void }) => {
	const id = useId();

	return (
		<div className="flex items-center gap-2">
			<Switch id={id} checked={checked} onCheckedChange={onCheckedChange} aria-label="Toggle switch" />
			<Label htmlFor={id}>
				<span className="sr-only">Toggle switch</span>
				{checked ? <EyeIcon className="size-4" aria-hidden="true" /> : <EyeOffIcon className="size-4" aria-hidden="true" />}
			</Label>
		</div>
	);
};

const onCenterOnLocation = () => {
	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(
			(pos) => {
				mapService.setView({ center: [pos.coords.longitude, pos.coords.latitude], zoom: 12 });
			},
			(err) => {
				console.error("Geolocation error:", err);
			},
		);
	} else {
		alert("Geolocation is not supported by your browser.");
	}
};

const ButtonGroupControls = () => {
	const { active: filterActive } = useFiltersStore();
	const { manualPage, setManualPage } = useMapPageStore();
	const [isFullscreen, setIsFullscreen] = useState(false);

	const onFullscreen = async () => {
		try {
			if (!document.fullscreenElement) {
				await document.documentElement.requestFullscreen();
			} else {
				await document.exitFullscreen();
			}
		} catch (err) {
			console.error("Fullscreen error:", err);
		}
	};

	useEffect(() => {
		const handleFullscreenChange = () => {
			setIsFullscreen(!!document.fullscreenElement);
		};

		document.addEventListener("fullscreenchange", handleFullscreenChange);
		return () => {
			document.removeEventListener("fullscreenchange", handleFullscreenChange);
		};
	}, []);

	return (
		<div className="inline-flex w-fit -space-x-px rounded-md shadow-xs rtl:space-x-reverse">
			<Tooltip>
				<TooltipTrigger
					delay={100}
					render={
						<Button className="rounded-none rounded-l-md shadow-none focus-visible:z-10" variant="outline" onClick={onFullscreen}>
							{isFullscreen ? <MinimizeIcon /> : <MaximizeIcon />}
							<span className="sr-only">Fullscreen</span>
						</Button>
					}
				></TooltipTrigger>
				<TooltipContent className="pr-1.5">
					<div className="flex items-center gap-2">
						Fullscreen <Kbd>{navigator.platform.startsWith("Mac") ? "⌃⌘F" : "F11"}</Kbd>
					</div>
				</TooltipContent>
			</Tooltip>
			<Tooltip>
				<TooltipTrigger
					delay={100}
					render={
						<Button className="rounded-none shadow-none focus-visible:z-10" variant="outline" onClick={() => mapService.setView({ zoomStep: 1 })}>
							<PlusIcon />
							<span className="sr-only">Zoom In</span>
						</Button>
					}
				></TooltipTrigger>
				<TooltipContent>
					<div className="flex items-center gap-2">Zoom In</div>
				</TooltipContent>
			</Tooltip>
			<Tooltip>
				<TooltipTrigger
					delay={100}
					render={
						<Button className="rounded-none shadow-none focus-visible:z-10" variant="outline" onClick={() => mapService.setView({ zoomStep: -1 })}>
							<MinusIcon />
							<span className="sr-only">Zoom Out</span>
						</Button>
					}
				></TooltipTrigger>
				<TooltipContent>
					<div className="flex items-center gap-2">Zoom Out</div>
				</TooltipContent>
			</Tooltip>
			<Tooltip>
				<TooltipTrigger
					delay={100}
					render={
						<Button className="rounded-none shadow-none focus-visible:z-10" variant="outline" onClick={onCenterOnLocation}>
							<LocateIcon />
							<span className="sr-only">Locate</span>
						</Button>
					}
				></TooltipTrigger>
				<TooltipContent>
					<div className="flex items-center gap-2">Locate</div>
				</TooltipContent>
			</Tooltip>
			<Tooltip>
				<TooltipTrigger
					delay={100}
					render={
						<Button className="rounded-none shadow-none focus-visible:z-10" variant="outline" onClick={() => mapService.setView({ rotation: 0 })}>
							<RefreshCcwDotIcon />
							<span className="sr-only">Reset Rotation</span>
						</Button>
					}
				></TooltipTrigger>
				<TooltipContent>
					<div className="flex items-center gap-2">Reset Rotation</div>
				</TooltipContent>
			</Tooltip>
			<Tooltip>
				<TooltipTrigger
					delay={100}
					render={
						<Button
							className="rounded-none shadow-none focus-visible:z-10"
							style={{ backgroundColor: manualPage === "filters" ? "var(--primary)" : "" }}
							variant="outline"
							onClick={() => setManualPage(manualPage === "filters" ? null : "filters")}
						>
							<FunnelIcon
								style={{
									fill: filterActive && manualPage !== "filters" ? "var(--primary)" : "",
									stroke: filterActive && manualPage !== "filters" ? "var(--primary)" : "",
								}}
							/>
							<span className="sr-only">Open Filters</span>
						</Button>
					}
				></TooltipTrigger>
				<TooltipContent>
					<div className="flex items-center gap-2">Open Filters</div>
				</TooltipContent>
			</Tooltip>
			<Tooltip>
				<TooltipTrigger
					delay={100}
					render={
						<Button
							className="rounded-none rounded-r-md shadow-none focus-visible:z-10"
							style={{ backgroundColor: manualPage === "settings" ? "var(--primary)" : "" }}
							variant="outline"
							onClick={() => setManualPage(manualPage === "settings" ? null : "settings")}
						>
							<LayersIcon />
							<span className="sr-only">Open Settings</span>
						</Button>
					}
				></TooltipTrigger>
				<TooltipContent>
					<div className="flex items-center gap-2">Open Settings</div>
				</TooltipContent>
			</Tooltip>
		</div>
	);
};
