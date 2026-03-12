import type { PilotLong } from "@sr24/types/interface";
import { UserIcon } from "lucide-react";
import { BadgeControllerRating, BadgePilotRating, BadgeUserHours } from "@/components/shared/Badge";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { getControllerRatingShort, getPilotRatingLong, getPilotRatingShort } from "@/lib/ratings";

export function PilotUser({ pilot }: { pilot: PilotLong }) {
	return (
		<AccordionItem value="user" className="overflow-hidden flex flex-col">
			<AccordionTrigger className="items-center data-panel-open:bg-muted hover:no-underline group">
				<div className="flex items-center gap-4">
					<UserIcon className="size-4 shrink-0" />
					<span className="group-hover:underline">Pilot</span>
					<span className="inline-block">
						<div className="flex items-center gap-1">
							<BadgeUserHours hours={pilot.user_ratings?.pilot_hours || 0} />
							<BadgePilotRating rating={pilot.user_ratings?.pilot_rating || 0} text={getPilotRatingShort(pilot.user_ratings?.pilot_rating)} />
							<BadgeControllerRating
								rating={pilot.user_ratings?.controller_rating}
								text={getControllerRatingShort(pilot.user_ratings?.controller_rating)}
							/>
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
					<span>{getPilotRatingLong(pilot.user_ratings?.pilot_rating)}</span>
				</div>
			</AccordionContent>
		</AccordionItem>
	);
}
