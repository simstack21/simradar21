"use client";

import { ClockIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useSettingsStore } from "@/storage/zustand";

function getTime(time: Date | null, timeZone: "utc" | "local"): string {
	if (!time) return "--:--";

	const hours = timeZone === "utc" ? time.getUTCHours() : time.getHours();
	const minutes = timeZone === "utc" ? time.getUTCMinutes() : time.getMinutes();

	const formattedHours = String(hours).padStart(2, "0");
	const formattedMinutes = String(minutes).padStart(2, "0");

	return `${formattedHours}:${formattedMinutes}${timeZone === "utc" ? " z" : ""}`;
}

export default function Clock() {
	const { timeZone } = useSettingsStore();
	const [time, setTime] = useState<Date | null>(null);

	useEffect(() => {
		setTime(new Date());

		const interval = setInterval(() => {
			setTime(new Date());
		}, 1000);

		return () => clearInterval(interval);
	}, []);

	return (
		<div className="flex gap-1">
			<ClockIcon className="size-4" aria-hidden="true" />
			<span>{getTime(time, timeZone)}</span>
		</div>
	);
}
