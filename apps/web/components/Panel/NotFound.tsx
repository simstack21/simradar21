import { AlertCircleIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Button } from "../ui/button";

export default function NotFoundPanel({ title, description, onClick }: { title: string; description: string; onClick: () => void }) {
	return (
		<div className="max-h-full glass-panel rounded-md pointer-events-auto p-2">
			<Alert variant="destructive" className="max-w-md bg-muted/50 flex flex-col gap-2">
				<div className="flex gap-2 items-center">
					<AlertCircleIcon />
					<AlertTitle>{title}</AlertTitle>
				</div>
				<div className="flex flex-col gap-2">
					<AlertDescription className="px-1">{description}</AlertDescription>
					<Button variant="destructive" onClick={onClick}>
						Close
					</Button>
				</div>
			</Alert>
		</div>
	);
}
