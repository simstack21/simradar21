"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { dxDatabaseIsStale, dxEnsureInitialized } from "@/storage/dexie";
import { Progress, ProgressLabel, ProgressValue } from "../components/ui/progress";
import { Spinner } from "../components/ui/spinner";

type StatusMap = {
	airports?: boolean;
	firs?: boolean;
	tracons?: boolean;
	airlines?: boolean;
	aircrafts?: boolean;
	vatglasses?: boolean;
	navigraph?: boolean;
};

export type StatusSetter = (status: Partial<StatusMap> | ((prev: Partial<StatusMap>) => Partial<StatusMap>)) => void;

function getInitializerText(status: StatusMap): string {
	if (!status.airports) {
		return "Downloading airport data";
	} else if (!status.firs) {
		return "Downloading VAT-Spy data";
	} else if (!status.tracons) {
		return "Downloading SimAware data";
	} else if (!status.airlines) {
		return "Downloading airline data";
	} else if (!status.aircrafts) {
		return "Downloading aircraft data";
	} else if (!status.vatglasses) {
		return "Downloading VATGlasses data";
	} else if (!status.navigraph) {
		return "Downloading Navigraph data";
	} else {
		return "Initialization complete!";
	}
}

export default function useInitializer() {
	const [status, setStatus] = useState<StatusMap>({});
	const toastIdRef = useRef<string | number | null>(null);

	useEffect(() => {
		if (dxDatabaseIsStale()) {
			toastIdRef.current = toast(
				() => (
					<div className="flex flex-col gap-2">
						<div className="flex font-bold gap-2">
							<Spinner />
							<span>Updating local databases</span>
						</div>
						<div>Downloading airport data</div>
						<div className="text-xs">This can take up to a minute during the first load.</div>
					</div>
				),
				{
					duration: Infinity,
				},
			);
			dxEnsureInitialized(setStatus);
		}
	}, []);

	useEffect(() => {
		if (toastIdRef.current) {
			if (Object.keys(status).length === 7) {
				toast.dismiss(toastIdRef.current);
				return;
			}

			toast(
				() => (
					<div className="flex flex-col gap-2">
						<div className="flex items-center font-bold gap-2">
							<Spinner />
							<span>Updating Local Databases</span>
						</div>
						<Progress value={Math.round((Object.keys(status).length / 7) * 100)} className="w-full max-w-sm">
							<ProgressLabel>{getInitializerText(status)}</ProgressLabel>
							<ProgressValue />
						</Progress>
						<div className="text-xs">This can take up to a minute during the first load.</div>
					</div>
				),
				{
					id: toastIdRef.current,
					duration: Infinity,
				},
			);
		}
	}, [status]);
}
