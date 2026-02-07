"use client";

import { ClockIcon } from "lucide-react";
import { useEffect, useState } from "react";

function getTime(time: Date | null): string {
	if (!time) return "--:--";

	const hours = time.getUTCHours();
	const minutes = time.getUTCMinutes();

	const formattedHours = String(hours).padStart(2, "0");
	const formattedMinutes = String(minutes).padStart(2, "0");

	return `${formattedHours}:${formattedMinutes}`;
}

export default function Clock() {
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
			<span>{getTime(time)} z</span>
		</div>
	);
}
