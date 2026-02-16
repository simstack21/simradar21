import type { PilotLong } from "@sr24/types/interface";
import { UserIcon } from "lucide-react";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function PilotUser({ pilot }: { pilot: PilotLong }) {
	return (
		<AccordionItem value="user" className="overflow-hidden flex flex-col">
			<AccordionTrigger className="items-center data-panel-open:bg-muted">
				<div className="flex items-center gap-4">
					<UserIcon className="size-4 shrink-0" />
					<span>Pilot</span>
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
					<span>{pilot.pilot_rating}</span>
				</div>
			</AccordionContent>
		</AccordionItem>
	);
}
