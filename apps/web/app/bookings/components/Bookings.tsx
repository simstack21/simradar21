"use client";

import type { Booking } from "@sr24/types/interface";
import { SnailIcon, VideoIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import Clock from "@/components/shared/Clock";
import { fetchApi } from "@/lib/api";
import { convertTime, getShortDate } from "@/lib/helpers";
import { useSettingsStore } from "@/storage/zustand";
import { init, setFeaturesByTime } from "../lib";
import BookingControls from "./BookingControls";
import BookingsMap from "./BookingsMap";

export const REPLAY_SPEEDS = [1, 2, 4, 8, 16];
const STEP_MINUTES = 30;

export default function Bookings() {
	const { data } = useSWR<Booking[]>("/data/bookings", fetchApi, {
		refreshInterval: 10 * 60 * 1000,
		revalidateOnFocus: false,
	});

	const { timeZone } = useSettingsStore();

	const [progress, setProgress] = useState(0);
	const [playing, setPlaying] = useState(false);
	const [speedIndex, setSpeedIndex] = useState(2);

	const timeline = useMemo(() => buildTimeline(data || []), [data]);

	useEffect(() => {
		if (!timeline.length) return;
		setProgress(getCurrentTimelineStep(timeline));
	}, [timeline]);

	useEffect(() => {
		if (data) {
			init(data);
		}
	}, [data]);

	useEffect(() => {
		setFeaturesByTime(timeline[progress]);
	}, [progress, timeline]);

	useEffect(() => {
		if (!playing) return;
		if (!timeline.length) return;

		const intervalMs = (1 / REPLAY_SPEEDS[speedIndex]) * 2000;
		const maxIndex = timeline.length - 1;

		const interval = setInterval(() => {
			setProgress((prev) => {
				if (prev >= maxIndex) {
					setPlaying(false);
					return prev;
				}
				return prev + 1;
			});
		}, intervalMs);

		return () => clearInterval(interval);
	}, [playing, speedIndex, timeline.length]);

	return (
		<>
			<BookingsMap />
			<footer className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center gap-2 py-1 px-2 rounded-xl outline border overflow-hidden backdrop-blur-md bg-linear-to-r from-white/1 from-20% via-white/3 via-50% to-white/1">
				<BookingControls
					progress={progress}
					setProgress={setProgress}
					setNow={() => setProgress(getCurrentTimelineStep(timeline))}
					setSpeedIndex={setSpeedIndex}
					setPlaying={setPlaying}
					playing={playing}
					max={timeline.length - 1}
				/>
				<div className="flex items-center justify-center gap-4 text-xs">
					<Clock />
					<div className="flex gap-1">
						<VideoIcon className="size-4" aria-hidden="true" />
						<span>{`${getShortDate(timeline[progress], timeZone)} ${convertTime(timeline[progress], "24h", timeZone)}`}</span>
					</div>
					<div className="flex gap-1">
						<SnailIcon className="size-4" aria-hidden="true" />
						<span>{REPLAY_SPEEDS[speedIndex]} x</span>
					</div>
				</div>
			</footer>
		</>
	);
}

function buildTimeline(bookings: Booking[]) {
	if (!bookings.length) return [];

	const start = new Date(bookings[0].start).getTime();
	const end = new Date(bookings[bookings.length - 1].end).getTime();

	const stepMs = STEP_MINUTES * 60 * 1000;
	const timeline = [];

	for (let t = start; t <= end; t += stepMs) {
		timeline.push(t);
	}

	return timeline;
}

function getCurrentTimelineStep(timeline: number[]) {
	if (!timeline.length) return 0;

	const now = Date.now();

	const idx = timeline.findIndex((t) => t > now);
	return idx === -1 ? timeline.length - 1 : Math.max(0, idx - 1);
}
