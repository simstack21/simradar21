import { Button } from "@/components/ui/button";
import { useSettingsStore } from "@/storage/zustand";

export default function SettingFooter() {
	const { resetMapSettings } = useSettingsStore();

	return (
		<div className="flex gap-2 items-center p-2">
			<Button variant="destructive" onClick={resetMapSettings} className="w-full">
				Reset
			</Button>
		</div>
	);
}
