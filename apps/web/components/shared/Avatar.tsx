import type { StaticAirline } from "@sr24/types/db";
import { useSession } from "next-auth/react";
import UserIcon from "@/assets/images/icons/user.jpeg";
import FlagSprite from "@/assets/images/sprites/flagSprite42.png";
import { Avatar, AvatarBadge, AvatarFallback, AvatarImage } from "../ui/avatar";

export const AvatarUser = ({ withBadge }: { withBadge?: boolean }) => {
	const { data: session } = useSession();

	return (
		<Avatar size="sm">
			<AvatarImage src={UserIcon.src} alt="@you" />
			<AvatarFallback>U</AvatarFallback>
			{withBadge && <AvatarBadge className={`${session?.vatsim ? "bg-green" : "bg-red"}`} />}
		</Avatar>
	);
};

export const AvatarAirline = ({
	airline,
	size = "default",
	className,
}: {
	airline: StaticAirline | null;
	size?: "default" | "sm" | "lg";
	className?: string;
}) => {
	const color = airline?.color;

	if (!color || color.length < 2) {
		return (
			<Avatar className={`flex items-center justify-center bg-white ${className}`} size={size}>
				<span className={`text-green font-bold ${size === "lg" && "text-xl"} ${size === "sm" && "text-sm"}`}>{airline?.iata ?? "?"}</span>
			</Avatar>
		);
	}

	const letters = airline.iata.split("");

	return (
		<Avatar className={`flex items-center justify-center ${className}`} style={{ backgroundColor: color[0] }} size={size}>
			<span className={`font-bold ${size === "lg" && "text-xl"} ${size === "sm" && "text-sm"}`} style={{ color: color[1] }}>
				{letters[0]}
			</span>
			<span
				className={`font-bold ${size === "lg" && "text-xl"} ${size === "sm" && "text-sm"}`}
				style={{ color: color.length > 2 ? color[2] : color[1] }}
			>
				{letters[1]}
			</span>
		</Avatar>
	);
};

export const AvatarCountry = ({ country, size = "default", className }: { country: string; size?: "default" | "sm" | "lg"; className?: string }) => {
	return (
		<Avatar className={`flex items-center justify-center overflow-hidden ${className}`} size={size}>
			<span className={`fflag ff-lg fflag-${country} shrink-0`} style={{ backgroundImage: `url(${FlagSprite.src})` }}></span>
		</Avatar>
	);
};
