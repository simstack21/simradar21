import { CheckIcon, ShareIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function SectorFooter({ callsign }: { callsign: string }) {
	const [shared, setShared] = useState(false);

	const onShareClick = () => {
		navigator.clipboard.writeText(`${window.location.origin}/sector/${callsign}`);
		toast.success("Link Copied to Clipboard!");
		setShared(true);
		setTimeout(() => setShared(false), 2000);
	};

	return (
		<div className="flex gap-2 items-center p-2">
			<Button variant="outline" onClick={onShareClick} className="w-full">
				{shared ? <CheckIcon className="text-green" /> : <ShareIcon />}
			</Button>
		</div>
	);
}
