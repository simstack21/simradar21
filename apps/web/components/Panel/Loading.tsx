import { Skeleton } from "../ui/skeleton";

export default function LoadingPanel({ dashboard }: { dashboard?: boolean }) {
	if (dashboard)
		return (
			<div className="max-h-full glass-panel rounded-md pointer-events-auto p-2 flex flex-col gap-2">
				<div className="flex flex-col gap-1">
					<Skeleton className="h-6 w-2/3" />
					<Skeleton className="h-4 w-1/2" />
				</div>
				<Skeleton className="aspect-video w-full" />
			</div>
		);

	return (
		<div className="max-h-full glass-panel rounded-md pointer-events-auto p-2 flex flex-col gap-2">
			<div className="flex gap-2">
				<Skeleton className="h-10 w-10 rounded-full shrink-0" />
				<div className="flex flex-col gap-1 w-full">
					<Skeleton className="h-6 w-2/3" />
					<Skeleton className="h-4 w-1/2" />
				</div>
			</div>
			<Skeleton className="aspect-video w-full" />
		</div>
	);
}
