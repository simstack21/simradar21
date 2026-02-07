import Clock from "@/components/shared/Clock";
import Controls from "./Controls";
import Metrics from "./Metrics";

export default function Footer() {
	return (
		<footer className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center gap-2 py-1 px-2 rounded-xl outline border overflow-hidden backdrop-blur-md bg-linear-to-r from-white/1 from-20% via-white/3 via-50% to-white/1">
			<Controls />
			<div className="flex items-center justify-center gap-4 text-xs">
				<Metrics />
				<Clock />
			</div>
		</footer>
	);
}
