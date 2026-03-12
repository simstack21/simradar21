import { ClockIcon, PlaneIcon, StarIcon, TowerControlIcon, XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { getControllerRatingColor, getPilotRatingColor } from "@/lib/ratings";
import { cn } from "@/lib/utils";

const FEATURE_HELP_STORAGE_KEY = "simradar21-feature-help-seen";

export const BadgeFeatureHelp = ({ featureKey, text, className }: { featureKey: string; text: string; className?: string }) => {
	const [showHelp, setShowHelp] = useState(false);

	useEffect(() => {
		const stored = localStorage.getItem(FEATURE_HELP_STORAGE_KEY);
		let seenFeatures: Record<string, boolean> = {};

		if (stored) {
			try {
				seenFeatures = JSON.parse(stored);
			} catch (e) {
				console.error("Failed to parse feature help storage", e);
			}
		}

		if (!seenFeatures[featureKey]) {
			setShowHelp(true);
		}
	}, [featureKey]);

	const handleClose = () => {
		const stored = localStorage.getItem(FEATURE_HELP_STORAGE_KEY);
		let seenFeatures: Record<string, boolean> = {};

		if (stored) {
			try {
				seenFeatures = JSON.parse(stored);
			} catch (e) {
				console.error("Failed to parse feature help storage", e);
			}
		}

		seenFeatures[featureKey] = true;
		localStorage.setItem(FEATURE_HELP_STORAGE_KEY, JSON.stringify(seenFeatures));

		setShowHelp(false);
	};

	if (!showHelp) return null;

	return (
		<div className={`flex items-center gap-2 ${className}`}>
			<Badge variant="secondary" className="flex items-center">
				<StarIcon className="mr-0.5" aria-hidden="true" />
				Tip
				<button
					type="button"
					className="focus-visible:border-ring focus-visible:ring-ring/50 text-secondary-foreground/60 hover:text-secondary-foreground -my-px -ms-px -me-1.5 inline-flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-[inherit] p-0 transition-[color,box-shadow] outline-none focus-visible:ring-[3px]"
					aria-label="Close"
					onClick={handleClose}
				>
					<XIcon className="size-3" aria-hidden="true" />
				</button>
			</Badge>
			<p className="text-xs text-muted-foreground">{text}</p>
		</div>
	);
};

export const BadgeComingSoon = () => {
	return (
		<Badge variant="default" className="bg-magenta text-foreground">
			Coming Soon
		</Badge>
	);
};

const COLOR_MAP = {
	live: "border-green",
	pre: "border-magenta",
	off: "border-muted text-muted-foreground",
};

export const BadgePilotStatus = ({ status, className }: { status: "live" | "off" | "pre"; className?: string }) => {
	return (
		<Badge variant="outline" className={`${COLOR_MAP[status]} ${className || ""}`}>
			{status.toUpperCase()}
		</Badge>
	);
};

export const BadgeUserHours = ({ hours, className }: { hours: number | undefined; className?: string }) => {
	const ratio = hours ? Math.round((hours / 3000) * 100) : 0;
	const capped = Math.min(100, ratio);

	return (
		<Badge
			variant="default"
			className={cn("flex items-center text-white border-muted", className)}
			style={{
				background: `linear-gradient(
      to right,
      var(--red) ${capped}%,
      transparent ${capped}%
    )`,
			}}
		>
			<ClockIcon aria-hidden="true" />
			<span className="leading-none">{hours?.toLocaleString()}h</span>
		</Badge>
	);
};

export const BadgePilotRating = ({ rating, text, className }: { rating: number | undefined; text: string; className?: string }) => {
	return (
		<Badge variant="default" className={cn(getPilotRatingColor(rating), className)}>
			<PlaneIcon aria-hidden="true" />
			<span className="leading-none">{text}</span>
		</Badge>
	);
};

export const BadgeControllerRating = ({ rating, text, className }: { rating: number | undefined; text: string; className?: string }) => {
	return (
		<Badge variant="default" className={cn(getControllerRatingColor(rating), className)}>
			<TowerControlIcon aria-hidden="true" />
			<span className="leading-none">{text}</span>
		</Badge>
	);
};
