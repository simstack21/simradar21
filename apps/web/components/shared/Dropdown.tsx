import {
	CalendarClock,
	CheckIcon,
	DatabaseIcon,
	EllipsisVerticalIcon,
	LogOutIcon,
	type LucideIcon,
	MapIcon,
	NavigationIcon,
	SectionIcon,
	UserIcon,
} from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "../ui/button";
import { AvatarUser } from "./Avatar";
import { AlertDialogDeleteAccount } from "./Dialog";

type ListItem = {
	icon?: LucideIcon;
	src?: string;
	property: string;
	href?: string;
	description?: string;
};

function stripUserName(name: string): string {
	const trimmed = name.trim();

	// Only numbers → return as-is (after trim)
	if (/^\d+$/.test(trimmed)) {
		return trimmed;
	}

	// Has at least one letter AND one number → remove all numbers
	if (/[a-zA-Z]/.test(trimmed) && /\d/.test(trimmed)) {
		return trimmed.replace(/\d+/g, "").trim();
	}

	return trimmed;
}

export const DropdownUser = () => {
	const { data: session } = useSession();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger openOnHover>
				<AvatarUser withBadge />
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-56">
				<DropdownMenuGroup>
					{session?.vatsim && (
						<>
							<DropdownMenuLabel className="flex items-center gap-2">
								<AvatarUser />
								<div className="flex flex-1 flex-col">
									<span className="text-popover-foreground">{stripUserName(session.vatsim.name)}</span>
									<span className="text-muted-foreground text-xs">{session.vatsim.cid}</span>
								</div>
							</DropdownMenuLabel>
							<DropdownMenuSeparator />
						</>
					)}
					<DropdownMenuItem onClick={() => signIn("vatsim")} disabled={!!session?.vatsim}>
						<UserIcon />
						<span>{session?.vatsim ? "VATSIM Connected" : "Connect VATSIM"}</span>
						{session?.vatsim && <CheckIcon className="ml-auto text-green" />}
					</DropdownMenuItem>
					<DropdownMenuItem onClick={() => signIn("navigraph")} disabled={!!session?.navigraph}>
						<NavigationIcon />
						<span>{session?.navigraph ? "Navigraph Connected" : "Connect Navigraph"}</span>
						{session?.navigraph && <CheckIcon className="ml-auto text-green" />}
					</DropdownMenuItem>
					{session && (
						<>
							<DropdownMenuItem onClick={() => signOut()}>
								<LogOutIcon />
								<span>Sign Out</span>
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem variant="destructive" closeOnClick={false}>
								<AlertDialogDeleteAccount />
							</DropdownMenuItem>
						</>
					)}
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

const SHADCN_ICONS_BASE_URL = "https://cdn.shadcnstudio.com/ss-assets/brand-logo";
const navListItems: ListItem[] = [
	{
		icon: MapIcon,
		property: "Map",
		description: "Main Map",
		href: "/",
	},
	{
		icon: DatabaseIcon,
		property: "Data",
		description: "Various Stats and Data",
		href: "/data",
	},
	{
		icon: CalendarClock,
		property: "Bookings",
		description: "Bookings Map",
		href: "/bookings",
	},
	{
		icon: SectionIcon,
		property: "Policy",
		description: "Privacy Policy",
		href: "/policy",
	},
];
const communityListItems: ListItem[] = [
	{
		src: `${SHADCN_ICONS_BASE_URL}/github-icon.png?width=40&height=40&format=auto`,
		property: "GitHub",
		description: "GitHub Repository",
		href: "https://github.com/sebastiankrll/simradar21",
	},
	{
		src: `${SHADCN_ICONS_BASE_URL}/discord-icon.png?width=40&height=40&format=auto`,
		property: "Discord",
		description: "Discord Community",
		href: "https://discord.gg/eVvKBfUr",
	},
];

export const DropdownNavigation = () => {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				className="pr-2"
				openOnHover
				render={
					<Button variant="ghost">
						<EllipsisVerticalIcon data-icon="inline-start" />
					</Button>
				}
			></DropdownMenuTrigger>
			<DropdownMenuContent className="w-56">
				<DropdownMenuGroup>
					<DropdownMenuLabel>Navigation</DropdownMenuLabel>
					{navListItems.map((item) => (
						<DropdownMenuItemFromList key={item.property} item={item} />
					))}
					<DropdownMenuSeparator />
					<DropdownMenuLabel>Community</DropdownMenuLabel>
					{communityListItems.map((item) => (
						<DropdownMenuItemFromList key={item.property} item={item} />
					))}
					<DropdownMenuSeparator />
					<DropdownMenuLabel className="text-right text-xs">Version: {process.env.NEXT_PUBLIC_APP_RELEASE || "dev"}</DropdownMenuLabel>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

const DropdownMenuItemFromList = ({ item }: { item: ListItem }) => {
	const pathname = usePathname();

	return (
		<DropdownMenuItem disabled={item.href === pathname} className="group">
			<a
				href={item.href}
				className="flex items-center space-x-2"
				target={item.href?.startsWith("http") ? "_blank" : "_self"}
				rel="noopener noreferrer"
			>
				<span className="flex items-center justify-center rounded-md border bg-primary text-primary-foreground h-8 w-8">
					{item.icon && <item.icon />}
					{item.src && (
						<Image src={item.src} alt={`${item.property} Icon`} width={16} height={16} className="filter brightness-0 group-hover:invert" />
					)}
				</span>
				<div className="flex flex-col">
					<span className="text-popover-foreground">{item.property}</span>
					<span className="text-muted-foreground text-xs">{item.description}</span>
				</div>
			</a>
		</DropdownMenuItem>
	);
};
