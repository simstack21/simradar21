"use client";

import { UsersIcon, WifiIcon, WifiOffIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { type WsData, type WsPresence, wsClient } from "@/lib/ws";

function getTimestamp(date: Date | string): string {
	return new Date(date).toISOString().split("T")[1].split(".")[0];
}

export default function Metrics() {
	const [timestamp, setTimestamp] = useState<string>("");
	const [metrics, setMetrics] = useState<number | null>(null);
	const [stale, setStale] = useState<boolean>(false);

	useEffect(() => {
		setTimestamp(getTimestamp(new Date()));

		let timeoutId: NodeJS.Timeout;
		const handleMessage = (msg: WsData | WsPresence) => {
			if (msg.t === "presence") {
				setMetrics(msg.c);
				return;
			}

			setTimestamp(getTimestamp(msg.data.timestamp));
			setMetrics(msg.c);
			setStale(false);

			clearTimeout(timeoutId);
			timeoutId = setTimeout(() => {
				setStale(true);
			}, 60_000);
		};
		wsClient.addListener(handleMessage);

		return () => {
			wsClient.removeListener(handleMessage);
		};
	}, []);

	return (
		<>
			<div className="flex gap-1.5">
				<UsersIcon className="size-4" aria-hidden="true" />
				<span>{metrics || "..."}</span>
			</div>
			<div className="flex gap-1.5">
				{stale ? <WifiOffIcon className="size-4 text-red" aria-hidden="true" /> : <WifiIcon className="size-4 text-green" aria-hidden="true" />}
				{timestamp} z
			</div>
		</>
	);
}
