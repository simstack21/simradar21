import { StarIcon, XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

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
			<Badge variant="secondary">
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

const COLOR_MAP = {
	live: "bg-green",
	pre: "bg-magenta",
	off: "bg-muted text-muted-foreground",
};

export const BadgePilotStatus = ({ status }: { status: "live" | "off" | "pre" }) => {
	return <Badge className={`${COLOR_MAP[status]} py-0`}>{status.toUpperCase()}</Badge>;
};
