import { LayersPlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMapPageStore } from "@/storage/zustand";

export default function SettingHeader({
	minimized,
	setMinimized,
}: {
	minimized: boolean;
	setMinimized: React.Dispatch<React.SetStateAction<boolean>>;
}) {
	const { setManualPage } = useMapPageStore();

	return (
		<div className="flex gap-3 items-center p-2">
			<span className="h-10 w-10 text-muted bg-muted-foreground rounded-full flex justify-center items-center shrink-0">
				<LayersPlusIcon className="h-5 w-5" />
			</span>
			<span className="text-lg font-bold leading-none">Map Settings</span>
			<Button variant="outline" onClick={() => setMinimized((prev) => !prev)} className="ml-auto">
				{minimized ? "Show" : "Hide"}
			</Button>
			<Button variant="destructive" onClick={() => setManualPage(null)}>
				Close
			</Button>
		</div>
	);
}
