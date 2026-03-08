"use client";

import {
	ArrowRightIcon,
	CircleAlertIcon,
	CloudUploadIcon,
	FlameIcon,
	type LucideIcon,
	MousePointerClickIcon,
	NavigationIcon,
	RotateCcwIcon,
	SettingsIcon,
	SquareStackIcon,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import Simradar21Logo from "@/assets/images/logos/simradar21_icon.svg";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";

function WelcomeContent({ dismiss }: { dismiss: () => void }) {
	const [showFeatures, setShowFeatures] = useState(false);

	return (
		<div className="flex flex-col gap-6 grow overflow-hidden">
			{showFeatures ? (
				<FeatureList />
			) : (
				<>
					<div className="flex items-center gap-2 text-xl sm:text-3xl lg:text-4xl font-bold">
						<Image src={Simradar21Logo} alt="simradar21 icon" width={40} height={40} priority className="rounded-full mr-2" />
						Welcome to
						<span className="text-green">simradar21</span>!
					</div>
					<ScrollArea className="flex flex-col p-1 gap-4 overflow-hidden">
						<div className="flex flex-col gap-2 text-sm">
							<p>
								This is yet another VATSIM network monitoring project. It builds on the ideas and inspiration from several already existing and
								fantastic tools in the community. The goal here is not to reinvent the wheel — those solutions already do an amazing job — but rather
								to experiment, learn, and create something enjoyable and useful in its own way.
							</p>
							<p>
								This project started simply as a fun side project at the end of last year. I don't have a professional programming background;
								everything you see here is self-taught and built step by step out of curiosity and passion for both aviation and technology.
							</p>
							<p>
								What you're seeing now is an early <span className="text-green">BETA version</span>, but it's already packed with loads of features.
								Even more exciting ideas are currently in development, with many new features and improvements planned for the future.
							</p>
							<p>
								Thanks for stopping by, exploring the project, and being part of the journey. Enjoy the site and happy flying on the VATSIM network!
							</p>
						</div>
						<ScrollBar />
					</ScrollArea>
				</>
			)}
			<div className="flex gap-4 justify-between">
				<Button
					onClick={dismiss}
					size="lg"
					className="group bg-transparent bg-linear-to-r from-secondary via-secondary/10 to-secondary bg-size-[200%_auto] text-white hover:bg-transparent hover:bg-position-[99%_center] focus-visible:ring-secondary dark:from-secondary dark:via-secondary/75 dark:to-secondary dark:focus-visible:ring-secondary/50b"
				>
					Jump straight in!
					<FlameIcon className="ml-1 group-hover:fill-red group-hover:stroke-red" />
				</Button>
				{!showFeatures && (
					<Button
						onClick={() => setShowFeatures(true)}
						size="lg"
						className="group bg-transparent bg-linear-to-r from-primary via-primary/10 to-primary bg-size-[200%_auto] text-white hover:bg-transparent hover:bg-position-[99%_center] focus-visible:ring-primary dark:from-primary dark:via-primary/75 dark:to-primary dark:focus-visible:ring-primary/50b"
					>
						Show me the features
						<ArrowRightIcon className="ml-1 transition-transform duration-200 group-hover:translate-x-0.5" />
					</Button>
				)}
			</div>
		</div>
	);
}

type FeatureItem = {
	icon: LucideIcon;
	title: string;
	description: string;
	className?: string;
};

const featureItems: FeatureItem[] = [
	{
		icon: MousePointerClickIcon,
		title: "Modern UI/UX",
		description: "Fresh, responsive and fast user experience. Optimized for all devices!",
		className: "bg-red",
	},
	{
		icon: RotateCcwIcon,
		title: "Flight Replays",
		description: "Replay flights up to 7 days (longer in future updates).",
		className: "bg-green",
	},
	{
		icon: NavigationIcon,
		title: "Navigraph Integration",
		description: "View planned routes, blocked gates and edit routings on the fly.",
		className: "bg-blue",
	},
	{
		icon: CloudUploadIcon,
		title: "Cloud Sync",
		description: "Connect your VATSIM account and sync your settings across your devices.",
		className: "bg-magenta",
	},
	{
		icon: SquareStackIcon,
		title: "Multi View",
		description: "Fast switch between multi and single view, two views for all your insights.",
		className: "bg-yellow",
	},
	{
		icon: SettingsIcon,
		title: "Customize Experience",
		description: "Tailor the interface to your preferences with various settings and filters.",
		className: "bg-grey",
	},
];

function FeatureList() {
	return (
		<div className="flex flex-col gap-6 overflow-hidden">
			<div className="flex items-center gap-2 text-xl sm:text-3xl lg:text-4xl font-bold">
				<Image src={Simradar21Logo} alt="simradar21 icon" width={40} height={40} priority className="rounded-full mr-2" />
				Features
			</div>
			<ScrollArea className="flex flex-col p-1 gap-4 overflow-hidden">
				<div className="grid gap-4 grid-cols-1 md:grid-cols-2">
					{featureItems.map((item, index) => (
						<FeatureItem key={index} icon={<item.icon size={20} />} title={item.title} description={item.description} className={item.className} />
					))}
				</div>
				<div className="my-4 text-center">And some more lovely details and features here and there.</div>
				<div className="flex flex-col gap-2 mt-4 text-muted-foreground">
					<div className="flex gap-2">
						<CircleAlertIcon size={20} className="stroke-red shrink-0" />
						<p>
							Pilot positions are currently updated approximately every 15 seconds. This limitation stems from VATSIM's data access policies and
							cannot be altered unless direct server access is granted. As VATSIM is a non-commercial network, limiting heavy client connections helps
							to protect its infrastructure from excessive load. I am in contact with the VATSIM team, and if this website gains significant usage,
							they may consider granting faster access in future. So stay tuned!
						</p>
					</div>
					<div className="flex gap-2">
						<CircleAlertIcon size={20} className="stroke-red shrink-0" />
						<p>
							I'm currently in contact with Navigraph regarding access to additional data that would enable the display of detailed airport layouts,
							including taxiways and runways. If access is granted, I'll implement this feature as soon as possible!
						</p>
					</div>
				</div>
				<ScrollBar />
			</ScrollArea>
		</div>
	);
}

function FeatureItem({ icon, title, description, className }: { icon: React.ReactNode; title: string; description: string; className?: string }) {
	return (
		<div className="flex gap-4 max-w-70">
			<span className={cn("rounded-md w-10 h-10 flex items-center justify-center shrink-0", className)}>{icon}</span>
			<div className="flex flex-col gap-1">
				<span className="font-bold text-sm leading-none">{title}</span>
				<span className="text-muted-foreground">{description}</span>
			</div>
		</div>
	);
}

function ChangelogContent() {
	return (
		<>
			<DialogHeader>
				<DialogTitle>What's new in {process.env.NEXT_PUBLIC_APP_RELEASE ?? "this update"}</DialogTitle>
				<DialogDescription>Here's what changed since your last visit.</DialogDescription>
			</DialogHeader>
			<ul className="space-y-1 text-xs text-muted-foreground list-disc list-inside">
				<li>Various bug fixes and improvements</li>
			</ul>
		</>
	);
}

function UpdateModalInner({ modal, dismiss }: { modal: NonNullable<UpdateModalType>; dismiss: () => void }) {
	return (
		<Dialog open onOpenChange={(open) => !open && dismiss()}>
			<DialogContent
				showCloseButton={false}
				className="bg-muted/50 overflow-hidden min-w-[calc(100%-2rem)] sm:min-w-lg md:min-w-2xl lg:min-w-3xl max-h-[calc(100%-2rem)] flex flex-col"
			>
				{modal === "welcome" ? <WelcomeContent dismiss={dismiss} /> : <ChangelogContent />}
			</DialogContent>
		</Dialog>
	);
}

type UpdateModalType = "welcome" | "changelog" | null;

const VERSION_KEY = "simradar21-changelog";
const APP_VERSION = process.env.NEXT_PUBLIC_APP_RELEASE ?? "dev";

export function UpdateModal() {
	const [modal, setModal] = useState<UpdateModalType>(null);

	useEffect(() => {
		const stored = localStorage.getItem(VERSION_KEY);
		if (!stored) {
			setModal("welcome");
		} else if (stored !== APP_VERSION) {
			setModal("changelog");
		}
	}, []);

	const dismiss = () => {
		localStorage.setItem(VERSION_KEY, APP_VERSION);
		setModal(null);
	};

	if (!modal) return null;
	return <UpdateModalInner modal={modal} dismiss={dismiss} />;
}
