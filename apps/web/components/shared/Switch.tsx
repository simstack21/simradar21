"use client";

import { GlobeIcon, LocateIcon, MoonIcon, SunIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import { useId } from "react";
import { Switch } from "@/components/ui/switch";
import { storeUserSettings, useSettingsStore } from "@/storage/zustand";
import { Label } from "../ui/label";

export const SwitchTheme = () => {
	const id = useId();

	const { setTheme, theme } = useSettingsStore();
	const { data: session } = useSession();

	const onThemeChange = async () => {
		setTheme(theme === "dark" ? "light" : "dark");

		if (session) {
			storeUserSettings();
		}
	};

	return (
		<div className="inline-flex items-center gap-2 px-1">
			<Switch id={id} checked={theme === "dark"} onCheckedChange={onThemeChange} aria-label="Toggle switch" />
			<Label htmlFor={id}>
				<span className="sr-only">Toggle switch</span>
				{theme === "dark" ? <MoonIcon className="size-4" aria-hidden="true" /> : <SunIcon className="size-4" aria-hidden="true" />}
			</Label>
		</div>
	);
};

export const SwitchTimeZone = () => {
	const id = useId();

	const { setTimeZone, timeZone } = useSettingsStore();
	const { data: session } = useSession();

	const onTimeZoneChange = async () => {
		setTimeZone(timeZone === "local" ? "utc" : "local");

		if (session) {
			storeUserSettings();
		}
	};

	return (
		<div className="items-center gap-2 hidden md:flex px-1">
			<Switch id={id} checked={timeZone === "utc"} onCheckedChange={onTimeZoneChange} aria-label="Toggle switch" />
			<Label htmlFor={id}>
				<span className="sr-only">Toggle switch</span>
				{timeZone === "utc" ? <GlobeIcon className="size-4" aria-hidden="true" /> : <LocateIcon className="size-4" aria-hidden="true" />}
			</Label>
		</div>
	);
};
