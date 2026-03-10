"use client";

import useMediaQuery from "@mui/material/useMediaQuery";
import {
	DownloadIcon,
	MaximizeIcon,
	MinimizeIcon,
	MinusIcon,
	PauseIcon,
	PlayIcon,
	PlusIcon,
	RefreshCcwDotIcon,
	SnailIcon,
	SquareIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { mapService } from "../../lib";
import { REPLAY_SPEEDS } from "./Replay";

export default function ReplayControls({
	progress,
	setProgress,
	setSpeedIndex,
	setPlaying,
	playing,
	onDownload,
	speedIndex,
	max,
}: {
	progress: number;
	setProgress: React.Dispatch<React.SetStateAction<number>>;
	setSpeedIndex: React.Dispatch<React.SetStateAction<number>>;
	setPlaying: React.Dispatch<React.SetStateAction<boolean>>;
	playing: boolean;
	onDownload: () => void;
	speedIndex: number;
	max: number;
}) {
	const isMobile = useMediaQuery("(max-width: 1024px)");

	if (isMobile)
		return (
			<footer className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center gap-2 py-1 px-2 rounded-xl overflow-hidden glass-panel w-[calc(100%-2rem)]">
				<div className="flex flex-col items-center gap-2 w-full">
					<Slider value={progress} onValueChange={(value) => setProgress(value as number)} min={0} max={max} className="p-1 w-full" />
					<div className="flex gap-2">
						<ButtonGroupReplayControls
							playing={playing}
							setPlaying={setPlaying}
							setProgress={setProgress}
							setSpeedIndex={setSpeedIndex}
							onDownload={onDownload}
						/>
						<div className="flex items-center justify-center gap-1 text-xs">
							<SnailIcon className="size-4" aria-hidden="true" />
							<span>{REPLAY_SPEEDS[speedIndex]} x</span>
						</div>
					</div>
				</div>
			</footer>
		);

	return (
		<footer className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center gap-2 py-1 px-2 rounded-xl overflow-hidden glass-panel">
			<div className="flex flex-col gap-2">
				<Slider value={progress} onValueChange={(value) => setProgress(value as number)} min={0} max={max} className="p-1" />
				<div className="flex gap-2">
					<ButtonGroupMapControls />
					<ButtonGroupReplayControls
						playing={playing}
						setPlaying={setPlaying}
						setProgress={setProgress}
						setSpeedIndex={setSpeedIndex}
						onDownload={onDownload}
					/>
				</div>
			</div>
			<div className="flex items-center justify-center gap-1 text-xs">
				<SnailIcon className="size-4" aria-hidden="true" />
				<span>{REPLAY_SPEEDS[speedIndex]} x</span>
			</div>
		</footer>
	);
}

const ButtonGroupReplayControls = ({
	playing,
	setPlaying,
	setProgress,
	setSpeedIndex,
	onDownload,
}: {
	playing: boolean;
	setPlaying: React.Dispatch<React.SetStateAction<boolean>>;
	setProgress: React.Dispatch<React.SetStateAction<number>>;
	setSpeedIndex: React.Dispatch<React.SetStateAction<number>>;
	onDownload: () => void;
}) => {
	const isMobile = useMediaQuery("(max-width: 1024px)");

	return (
		<div className="inline-flex w-fit -space-x-px rounded-md shadow-xs rtl:space-x-reverse">
			<Tooltip>
				<TooltipTrigger
					delay={100}
					render={
						<Button className="rounded-none rounded-l-md shadow-none focus-visible:z-10" variant="outline" onClick={() => setProgress(0)}>
							<SquareIcon />
							<span className="sr-only">Reset</span>
						</Button>
					}
				></TooltipTrigger>
				<TooltipContent>
					<div className="flex items-center gap-2">Reset</div>
				</TooltipContent>
			</Tooltip>
			<Tooltip>
				<TooltipTrigger
					delay={100}
					render={
						<Button className="rounded-none shadow-none focus-visible:z-10" variant="outline" onClick={() => setPlaying((prev) => !prev)}>
							{playing ? <PauseIcon /> : <PlayIcon />}
							<span className="sr-only">Play/Pause</span>
						</Button>
					}
				></TooltipTrigger>
				<TooltipContent>
					<div className="flex items-center gap-2">Play/Pause</div>
				</TooltipContent>
			</Tooltip>
			<Tooltip>
				<TooltipTrigger
					delay={100}
					render={
						<Button
							className={cn("rounded-none shadow-none focus-visible:z-10", isMobile && "rounded-r-md")}
							variant="outline"
							onClick={() => setSpeedIndex((prev) => (prev === REPLAY_SPEEDS.length - 1 ? 0 : prev + 1))}
						>
							<SnailIcon />
							<span className="sr-only">Replay Speed</span>
						</Button>
					}
				></TooltipTrigger>
				<TooltipContent>
					<div className="flex items-center gap-2">Replay Speed</div>
				</TooltipContent>
			</Tooltip>
			{!isMobile && (
				<Tooltip>
					<TooltipTrigger
						delay={100}
						render={
							<Button className="rounded-none rounded-r-md shadow-none focus-visible:z-10" variant="outline" onClick={onDownload}>
								<DownloadIcon />
								<span className="sr-only">Download</span>
							</Button>
						}
					></TooltipTrigger>
					<TooltipContent>
						<div className="flex items-center gap-2">Download</div>
					</TooltipContent>
				</Tooltip>
			)}
		</div>
	);
};

const ButtonGroupMapControls = () => {
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
						Fullscreen <Kbd>F11</Kbd>
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
						<Button
							className="rounded-none rounded-r-md shadow-none focus-visible:z-10"
							variant="outline"
							onClick={() => mapService.setView({ rotation: 0 })}
						>
							<RefreshCcwDotIcon />
							<span className="sr-only">Reset Rotation</span>
						</Button>
					}
				></TooltipTrigger>
				<TooltipContent>
					<div className="flex items-center gap-2">Reset Rotation</div>
				</TooltipContent>
			</Tooltip>
		</div>
	);
};
