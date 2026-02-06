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
import { AvatarUser } from "./Avatar";
import { AlertDialogDeleteAccount } from "./Dialog";

type ListItem = {
	icon: LucideIcon;
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
			<DropdownMenuTrigger>
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
						{session?.vatsim && <CheckIcon className="ml-auto text-green-500 dark:text-green-600" />}
					</DropdownMenuItem>
					<DropdownMenuItem onClick={() => signIn("navigraph")} disabled={!!session?.navigraph}>
						<NavigationIcon />
						<span>{session?.navigraph ? "Navigraph Connected" : "Connect Navigraph"}</span>
						{session?.navigraph && <CheckIcon className="ml-auto text-green-500 dark:text-green-600" />}
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

export const DropdownNavigation = () => {
	const pathname = usePathname();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger className="pr-4">
				<EllipsisVerticalIcon size={20} />
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-56">
				<DropdownMenuGroup>
					<DropdownMenuLabel>Navigation</DropdownMenuLabel>
					{navListItems.map((item, index) => (
						<DropdownMenuItem key={index} disabled={item.href === pathname}>
							<a href={item.href} className="flex items-center space-x-2">
								<span className="flex items-center justify-center rounded-md border p-2 bg-primary text-primary-foreground">
									<item.icon />
								</span>
								<div className="flex flex-col">
									<span className="text-popover-foreground">{item.property}</span>
									<span className="text-muted-foreground text-xs">{item.description}</span>
								</div>
							</a>
						</DropdownMenuItem>
					))}
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
