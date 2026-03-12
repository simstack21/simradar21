"use client";

import { UsersIcon, WifiIcon, WifiOffIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { type WsMessage, wsClient } from "@/lib/ws";

function getTimestamp(date: Date | string): string {
	return new Date(date).toISOString().split("T")[1].split(".")[0];
}

export default function Metrics() {
	const [timestamp, setTimestamp] = useState<string | null>(null);
	const [metrics, setMetrics] = useState<number | null>(null);
	const [status, setStatus] = useState<boolean | null>(null);

	useEffect(() => {
		const handleMessage = (msg: WsMessage) => {
			if (msg.t === "status") {
				setStatus(msg.status);
				return;
			}
			if (msg.t === "presence") {
				setMetrics(msg.c);
				return;
			}
			if (msg.t !== "delta") return;

			setTimestamp(getTimestamp(msg.data.timestamp));
			setMetrics(msg.c);
		};
		wsClient.addListener(handleMessage);

		setTimestamp(getTimestamp(new Date()));
		setStatus(true);

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
			{status === true && (
				<div className="flex gap-0.5">
					<WifiIcon className="size-4 text-primary" aria-hidden="true" />
					<span className="px-1 rounded">{timestamp ?? "..."}z</span>
				</div>
			)}
			{status === false && (
				<div className="flex gap-0.5">
					<WifiOffIcon className="size-4 text-destructive" aria-hidden="true" />
					<span className="text-destructive bg-destructive/20 animate-pulse px-1 rounded">{timestamp ?? "..."}z</span>
				</div>
			)}
		</>
	);
}
