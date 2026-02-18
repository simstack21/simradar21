import { SaveIcon } from "lucide-react";
import { BadgeComingSoon } from "@/components/shared/Badge";
import { Button } from "@/components/ui/button";
import { useFiltersStore } from "@/storage/zustand";

export default function FilterFooter() {
	const { clearFilters, savePreset } = useFiltersStore();

	return (
		<div className="flex gap-2 items-center p-2">
			<Button variant="destructive" onClick={clearFilters}>
				Clear
			</Button>
			<Button onClick={() => savePreset("New Preset")} disabled>
				<SaveIcon data-icon="inline-start" />
				Preset
				<BadgeComingSoon />
			</Button>
		</div>
	);
}
