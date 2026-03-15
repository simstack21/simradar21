import type { PilotLong, UserRatings } from "@sr24/types/interface";
import { UserIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { BadgeControllerRating, BadgePilotRating, BadgeUserHours } from "@/components/shared/Badge";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { fetchApi } from "@/lib/api";
import { getControllerRatingShort, getPilotRatingLong, getPilotRatingShort } from "@/lib/ratings";

export function PilotUser({ pilot }: { pilot: PilotLong }) {
	const [userRatings, setUserRatings] = useState<UserRatings | null>(null);

	useEffect(() => {
		fetchApi<UserRatings>(`/data/member/ratings/${pilot.cid}`)
			.then((data) => setUserRatings(data))
			.catch(() => setUserRatings(null));
	}, [pilot.cid]);

	return (
		<AccordionItem value="user" className="overflow-hidden flex flex-col">
			<AccordionTrigger className="items-center data-panel-open:bg-muted hover:no-underline group gap-0">
				<div className="flex items-center">
					<UserIcon className="size-4 shrink-0 mr-4" />
					<span className="group-hover:underline mr-2">Pilot</span>
					<span className="inline-block">
						<div className="flex items-center gap-1">
							<BadgeUserHours hours={userRatings?.pilot_hours || 0} />
							<BadgePilotRating rating={userRatings?.pilot_rating || 0} text={getPilotRatingShort(userRatings?.pilot_rating)} />
							<BadgeControllerRating rating={userRatings?.controller_rating} text={getControllerRatingShort(userRatings?.controller_rating)} />
						</div>
					</span>
				</div>
			</AccordionTrigger>
			<AccordionContent className="py-1 grid grid-cols-2 gap-1">
				<div className="flex flex-col col-span-2">
					<span className="text-muted-foreground">Name</span>
					<span>{pilot.name}</span>
				</div>
				<div className="flex flex-col">
					<span className="text-muted-foreground">VATSIM ID</span>
					<span>{pilot.cid}</span>
				</div>
				<div className="flex flex-col">
					<span className="text-muted-foreground">Pilot Rating</span>
					<span>{getPilotRatingLong(userRatings?.pilot_rating)}</span>
				</div>
			</AccordionContent>
		</AccordionItem>
	);
}
