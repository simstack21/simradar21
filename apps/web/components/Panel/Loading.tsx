import { Skeleton } from "../ui/skeleton";

export default function LoadingPanel() {
	return (
		<div className="max-h-full glass-panel rounded-md pointer-events-auto p-2">
			<div className="flex flex-col gap-1">
				<Skeleton className="h-6 w-2/3" />
				<Skeleton className="h-4 w-1/2" />
				<Skeleton className="aspect-video w-full" />
			</div>
		</div>
	);
}
