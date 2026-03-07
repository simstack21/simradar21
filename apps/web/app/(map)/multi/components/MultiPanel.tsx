"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback } from "react";
import LoadingPanel from "@/components/Panel/Loading";
import { MotionPanel } from "@/components/Panel/PanelGrid";
import DashboardPanel from "../../components/Panels/Dashboard/DashboardPanel";
import { mapService } from "../../lib";
import MultiAirportPanel from "./MultiAirportPanel";
import MultiPilotPanel from "./MultiPilotPanel";
import MultiSectorPanel from "./MultiSectorPanel";

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
			const [type, featureId] = id.split(/_(.+)/);
			mapService.removeClickFeature(type, featureId);
		},
		[searchParams, router, pathname],
	);

	if (ids.length === 0)
		return (
			<MotionPanel className="max-h-full pointer-events-auto flex flex-col gap-3">
				<DashboardPanel />
			</MotionPanel>
		);

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
