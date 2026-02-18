"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback } from "react";
import { MotionPanel } from "@/components/Panel/PanelGrid";
import DashboardPanel from "../../components/Panels/Dashboard/DashboardPanel";
import MultiAirportPanel from "./MultiAirportPanel";
import MultiPilotPanel from "./MultiPilotPanel";
import MultiSectorPanel from "./MultiSectorPanel";
import LoadingPanel from "@/components/Panel/Loading";

export default function MultiPanel() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const pathname = usePathname();

	const selected = searchParams.get("selected") || "";
	const ids = selected.split(",").filter(Boolean);

	const removeSelected = useCallback(
		(id: string) => {
			const selected = searchParams.get("selected");
			if (!selected) return;

			const updated = selected.split(",").filter((foundId) => foundId !== id);
			const params = new URLSearchParams(searchParams.toString());

			if (updated.length === 0) {
				params.delete("selected");
			} else {
				params.set("selected", updated.join(","));
			}

			router.replace(`${pathname}?${params.toString()}`, { scroll: false });
		},
		[searchParams, router, pathname],
	);

	if (ids.length === 0) return <DashboardPanel />;

	return (
		<Suspense fallback={<LoadingPanel />}>
			<MotionPanel className="max-h-full pointer-events-auto flex flex-col gap-3">
				{ids.map((fullId) => {
					const [type, id] = fullId.split(/_(.+)/);
					if (!type || !id) return null;
					if (type === "pilot") {
						return (
							<MotionPanel key={fullId}>
								<MultiPilotPanel id={id} removeSelected={removeSelected} />
							</MotionPanel>
						);
					}
					if (type === "airport") {
						return (
							<MotionPanel key={fullId}>
								<MultiAirportPanel icao={id} removeSelected={removeSelected} />
							</MotionPanel>
						);
					}
					if (type === "sector") {
						return (
							<MotionPanel key={fullId}>
								<MultiSectorPanel callsign={id} removeSelected={removeSelected} />
							</MotionPanel>
						);
					}
					return null;
				})}
			</MotionPanel>
		</Suspense>
	);
}
