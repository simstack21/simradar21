import type { StaticAirport } from "@sr24/types/db";
import type { PilotLong, PilotParsedRoute, PilotRouteProcedure } from "@sr24/types/interface";
import type { NavigraphAirport, NavigraphApproach, NavigraphProcedure } from "@sr24/types/navigraph";
import { PlaneLandingIcon, PlaneTakeoffIcon, RotateCcwIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { mapService } from "@/app/(map)/lib";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getCachedAirport } from "@/storage/cache";
import { dxGetNavigraphAirport, dxGetNavigraphApproachesByAirport, dxGetNavigraphProceduresByAirport } from "@/storage/dexie";

export default function PilotProcedures({ pilot }: { pilot: PilotLong }) {
	const [modifiedRoute, setModifiedRoute] = useState<PilotParsedRoute | null>(
		pilot.overrides?.modifiedRoute || pilot.flight_plan?.parsed_route || null,
	);
	return (
		<ScrollArea className="max-h-full overflow-hidden flex flex-col">
			{pilot.flight_plan?.departure.icao && (
				<ProcedureCard pilot={pilot} type="departure" modifiedRoute={modifiedRoute} setModifiedRoute={setModifiedRoute} />
			)}
			{pilot.flight_plan?.arrival.icao && (
				<ProcedureCard pilot={pilot} type="arrival" modifiedRoute={modifiedRoute} setModifiedRoute={setModifiedRoute} />
			)}
			<ScrollBar />
		</ScrollArea>
	);
}

function ProcedureCard({
	pilot,
	type,
	modifiedRoute,
	setModifiedRoute,
}: {
	pilot: PilotLong;
	type: "departure" | "arrival";
	modifiedRoute: PilotParsedRoute | null;
	setModifiedRoute: React.Dispatch<React.SetStateAction<PilotParsedRoute | null>>;
}) {
	const [staticAirport, setStaticAirport] = useState<StaticAirport | null>(null);
	const [procedures, setProcedures] = useState<Procedures | null>(null);
	const [parsedProc, setParsedProc] = useState<PilotRouteProcedure | null>(
		type === "departure" ? modifiedRoute?.sid || null : modifiedRoute?.star || null,
	);

	const filteredProcedures = useMemo(() => {
		if (!procedures?.procedures || !parsedProc?.rwy) return procedures?.procedures;
		const selectedBase = rwyBase(parsedProc.rwy);
		return procedures.procedures.filter((p) => {
			if (!p.value) return true;
			const seg = p.value.split(":").at(-1) ?? "";
			return seg === "ALL" || seg === parsedProc.rwy || (seg.endsWith("B") && rwyBase(seg) === selectedBase);
		});
	}, [procedures?.procedures, parsedProc?.rwy]);

	const filteredTransitions = useMemo(() => {
		if (!procedures?.transitions || !parsedProc?.proc) return procedures?.transitions;
		const procPrefix = parsedProc.proc.split(":").slice(0, 2).join(":");
		return procedures.transitions.filter((p) => !p.value || p.value.startsWith(procPrefix));
	}, [procedures?.transitions, parsedProc?.proc]);

	const filteredApproaches = useMemo(() => {
		if (!procedures?.approaches || !parsedProc?.rwy) return procedures?.approaches;
		const rwySuffix = parsedProc.rwy.replace("RW", "");
		return procedures.approaches.filter((p) => !p.value || p.value.split(":")[1].includes(rwySuffix));
	}, [procedures?.approaches, parsedProc?.rwy]);

	const filteredAppTransitions = useMemo(() => {
		if (!procedures?.appTransitions || !parsedProc?.approach) return procedures?.appTransitions;
		const procPrefix = parsedProc.approach.split(":").slice(0, 2).join(":");
		return procedures.appTransitions.filter((p) => !p.value || p.value.startsWith(procPrefix));
	}, [procedures?.appTransitions, parsedProc?.approach]);

	useEffect(() => {
		const icao = pilot.flight_plan?.[type].icao;
		if (!icao) return;

		getCachedAirport(icao).then(setStaticAirport);
		if (type === "departure") {
			getDepartureProcedures(icao).then(setProcedures);
		} else {
			getArrivalProcedures(icao).then(setProcedures);
		}
	}, [pilot.flight_plan?.[type]?.icao, type]);

	const onProcChange = useCallback(
		(key: "rwy" | "proc" | "trans" | "approach" | "approachTrans", value: string | null) => {
			if (!parsedProc || !modifiedRoute) return;

			const updated: typeof parsedProc = { ...parsedProc, override: true };

			// If dep rwy change, update rwy connection or swap procedure to completely different departure with same id
			// If now procedure for new runway, clear procedure selection
			if (type === "departure" && key === "rwy") {
				const procPrefix = parsedProc.proc?.split(":").slice(0, -1).join(":");

				const newRwyConn = procedures?.rwyConnections?.find((conn) => conn.uid === `${procPrefix}:${value}`);
				updated.rwyCon = newRwyConn?.uid || null;

				const newProc =
					procedures?.procedures.find((proc) => proc.value === `${procPrefix}:${value}`) ||
					procedures?.procedures.find((proc) => proc.value === `${procPrefix}:ALL`);
				updated.proc = newProc?.value || null;
				if (!newProc) {
					updated.trans = null;
				}
			}

			// If proc change and runway specific, also update rwy
			const lastPart = value?.split(":").slice(-1)[0];
			if (key === "proc" && lastPart?.startsWith("RW") && !lastPart.endsWith("B")) {
				updated.rwy = lastPart;
				updated.rwyCon = null;
			}

			// If proc change and not runway specific, check for runway connection or clear rwy connection
			if (type === "departure" && key === "proc" && !lastPart?.startsWith("RW")) {
				const procPrefix = value?.split(":").slice(0, -1).join(":");
				const newRwyConn = procedures?.rwyConnections?.find((conn) => conn.uid === `${procPrefix}:${updated.rwy}`);
				updated.rwyCon = newRwyConn?.uid || null;
			}

			// If arr rwy change, check if procedure is compatible with new runway, if not clear procedure. Always clear approach
			if (type === "arrival" && key === "rwy") {
				if (parsedProc.proc?.split(":")[2] !== "ALL" && value && !parsedProc.proc?.includes(`:${value}`)) {
					updated.proc = null;
				}
				updated.approach = null;
				updated.approachTrans = null;
			}

			updated[key] = value || null;
			setParsedProc(updated);

			const newModifiedRoute = type === "departure" ? { ...modifiedRoute, sid: updated } : { ...modifiedRoute, star: updated };
			setModifiedRoute(newModifiedRoute);
			mapService.setFeatures({ autoTrackId: pilot.id, route: newModifiedRoute });

			fetch("/user/pilot", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ modifiedRoute: newModifiedRoute, id: pilot.id }),
			});
		},
		[parsedProc, procedures, pilot.id, modifiedRoute, setModifiedRoute, type],
	);

	const onProcReset = useCallback(() => {
		mapService.setFeatures({ autoTrackId: pilot.id, route: pilot.flight_plan?.parsed_route });
		setParsedProc(type === "departure" ? pilot.flight_plan?.parsed_route?.sid || null : pilot.flight_plan?.parsed_route?.star || null);

		fetch("/user/pilot", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ modifiedRoute: pilot.flight_plan?.parsed_route, id: pilot.id }),
		});
	}, [pilot.id, pilot.flight_plan?.parsed_route, type]);

	return (
		<Card size="sm" className="m-2 bg-muted/50">
			<CardHeader className="gap-0">
				<CardTitle className="flex items-center gap-2">
					{type === "departure" ? <PlaneTakeoffIcon size={16} /> : <PlaneLandingIcon size={16} />}
					<span>{staticAirport?.id || pilot.flight_plan?.[type].icao}</span>
					<Badge variant={parsedProc?.override ? "secondary" : "outline"} className="ml-auto leading-0">
						{parsedProc?.override ? "Edited" : "Auto Detected"}
					</Badge>
					{parsedProc?.override && (
						<Button variant="outline" size="icon" onClick={onProcReset}>
							<RotateCcwIcon />
						</Button>
					)}
				</CardTitle>
				<CardDescription>{staticAirport?.name || "Unknown"}</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col gap-1">
				{procedures?.rwys && procedures.rwys.length > 1 && (
					<div className="flex flex-col gap-0.5">
						<div className="flex items-center gap-2">
							<span className="h-2 w-2 rounded-xs shrink-0 bg-[#51c9fd]" />
							<span className="text-xs">Runway</span>
						</div>
						<Select items={procedures.rwys} value={parsedProc?.rwy} onValueChange={(value) => onProcChange("rwy", value)}>
							<SelectTrigger className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									<SelectLabel>Runway Selection</SelectLabel>
									{procedures.rwys.map((rwy) => (
										<SelectItem key={rwy.value} value={rwy.value}>
											{rwy.label}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>
					</div>
				)}
				{filteredProcedures && filteredProcedures.length > 1 && (
					<div className="flex flex-col gap-0.5">
						<div className="flex items-center gap-2">
							<span className={cn("h-2 w-2 rounded-xs shrink-0", type === "departure" ? "bg-[#dc649f]" : "bg-[#98ca7f]")} />
							<span className="text-xs">{type === "departure" ? "SID" : "STAR"}</span>
						</div>
						<Select items={filteredProcedures} value={parsedProc?.proc} onValueChange={(value) => onProcChange("proc", value)}>
							<SelectTrigger className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									<SelectLabel>{type === "departure" ? "SID Selection" : "STAR Selection"}</SelectLabel>
									{filteredProcedures.map((proc) => (
										<SelectItem key={proc.value} value={proc.value}>
											{proc.label}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>
					</div>
				)}
				{filteredTransitions && filteredTransitions.length > 1 && (
					<div className="flex flex-col gap-0.5">
						<div className="flex items-center gap-2">
							<span className={cn("h-2 w-2 rounded-xs shrink-0", type === "departure" ? "bg-[#dc649f]" : "bg-[#98ca7f]")} />
							<span className="text-xs">Transition</span>
						</div>
						<Select items={filteredTransitions} value={parsedProc?.trans} onValueChange={(value) => onProcChange("trans", value)}>
							<SelectTrigger className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									<SelectLabel>{type === "departure" ? "SID Transition Selection" : "STAR Transition Selection"}</SelectLabel>
									{filteredTransitions.map((proc) => (
										<SelectItem key={proc.value} value={proc.value}>
											{proc.label}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>
					</div>
				)}
				{filteredApproaches && filteredApproaches.length > 1 && (
					<div className="flex flex-col gap-0.5">
						<div className="flex items-center gap-2">
							<span className="h-2 w-2 rounded-xs shrink-0 bg-[#f3ac7a]" />
							<span className="text-xs">Approach</span>
						</div>
						<Select items={filteredApproaches} value={parsedProc?.approach} onValueChange={(value) => onProcChange("approach", value)}>
							<SelectTrigger className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									<SelectLabel>Approach Selection</SelectLabel>
									{filteredApproaches.map((proc) => (
										<SelectItem key={proc.value} value={proc.value}>
											{proc.label}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>
					</div>
				)}
				{filteredAppTransitions && filteredAppTransitions.length > 1 && (
					<div className="flex flex-col gap-0.5">
						<div className="flex items-center gap-2">
							<span className="h-2 w-2 rounded-xs shrink-0 bg-[#f3ac7a]" />
							<span className="text-xs">Approach Transition</span>
						</div>
						<Select items={filteredAppTransitions} value={parsedProc?.approachTrans} onValueChange={(value) => onProcChange("approachTrans", value)}>
							<SelectTrigger className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									<SelectLabel>Approach Transition Selection</SelectLabel>
									{filteredAppTransitions.map((proc) => (
										<SelectItem key={proc.value} value={proc.value}>
											{proc.label}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

const rwyBase = (s: string) => s.replace(/^RW/, "").replace(/[A-Z]$/, "");

type SelectProps = {
	value: string | null;
	label: string;
};

type Procedures = {
	rwys: SelectProps[];
	rwyConnections: NavigraphProcedure[];
	procedures: SelectProps[];
	transitions: SelectProps[];
	approaches: SelectProps[];
	appTransitions: SelectProps[];
};

async function getDepartureProcedures(icao: string): Promise<Procedures> {
	const airport = await dxGetNavigraphAirport(icao);
	const allProcedures = await dxGetNavigraphProceduresByAirport("sids", icao);

	const { procedures, rwyConnections } = parseProcedures(allProcedures);

	return {
		rwys: parseRunways(airport),
		rwyConnections,
		procedures,
		transitions: parseTransitions(allProcedures),
		approaches: [],
		appTransitions: [],
	};
}

async function getArrivalProcedures(icao: string): Promise<Procedures> {
	const airport = await dxGetNavigraphAirport(icao);
	const allProcedures = await dxGetNavigraphProceduresByAirport("stars", icao);
	const allApproaches = await dxGetNavigraphApproachesByAirport(icao);

	const { procedures, rwyConnections } = parseProcedures(allProcedures);
	const { approaches, appTransitions } = parseApproaches(allApproaches);

	return {
		rwys: parseRunways(airport),
		rwyConnections,
		procedures,
		transitions: parseTransitions(allProcedures),
		approaches,
		appTransitions,
	};
}

function parseProcedures(allProcedures: NavigraphProcedure[]): {
	procedures: SelectProps[];
	rwyConnections: NavigraphProcedure[];
} {
	const grouped = new Map<string, NavigraphProcedure[]>();
	for (const proc of allProcedures.filter((p) => p.uid.split(":")[2].startsWith("RW") || p.uid.split(":")[2].startsWith("ALL"))) {
		const group = grouped.get(proc.id) ?? [];
		group.push(proc);
		grouped.set(proc.id, group);
	}

	const procedureMap = new Map<string, NavigraphProcedure>();
	const rwyConnections: NavigraphProcedure[] = [];
	for (const [id, procs] of grouped) {
		const allEntry = procs.find((p) => p.uid.split(":")[2].startsWith("ALL"));
		if (allEntry) {
			procedureMap.set(id, allEntry);
			rwyConnections.push(...procs.filter((p) => p.uid.split(":")[2].startsWith("RW")));
		} else {
			procedureMap.set(id, procs[0]);
		}
	}

	const procedures: SelectProps[] = [{ value: null, label: "None" }];
	for (const proc of procedureMap.values()) {
		if (proc.uid.split(":")[2].startsWith("RW")) {
			procedures.push({ value: proc.uid, label: `${proc.id} (RWY ${proc.uid.split(":")[2].slice(2)})` });
		} else {
			procedures.push({ value: proc.uid, label: proc.id });
		}
	}

	return { procedures, rwyConnections };
}

function parseTransitions(allProcedures: NavigraphProcedure[]): SelectProps[] {
	const transProcs = allProcedures.filter((proc) => !proc.uid.split(":")[2].startsWith("RW") && !proc.uid.split(":")[2].startsWith("ALL"));
	const transitions: SelectProps[] = [{ value: null, label: "None" }];
	transProcs.forEach((proc) => void transitions.push({ value: proc.uid, label: `${proc.uid.split(":")[2]} (${proc.id})` }));

	return transitions;
}

function parseRunways(airport: NavigraphAirport | undefined): SelectProps[] {
	const runways: SelectProps[] = [{ value: null, label: "None" }];
	airport?.runways.forEach((rw) => void runways.push({ value: rw.id, label: rw.id }));
	return runways;
}

function parseApproaches(allApproaches: NavigraphApproach[]): { approaches: SelectProps[]; appTransitions: SelectProps[] } {
	const approaches: SelectProps[] = [{ value: null, label: "None" }];
	const appTransitions: SelectProps[] = [{ value: null, label: "None" }];

	for (const proc of allApproaches) {
		if (proc.uid.split(":")[2] === "FINAL") {
			approaches.push({ value: proc.uid, label: convertApproachId(proc.id) });
			continue;
		}
		if (proc.uid.split(":")[2] !== "MISSED") {
			appTransitions.push({ value: proc.uid, label: `${proc.uid.split(":")[2]} (${convertApproachId(proc.id)})` });
		}
	}

	return { approaches, appTransitions };
}

const APPROACH_PREFIX: Record<string, string> = {
	B: "LOC ",
	L: "LOC ",
	D: "VOR DME ",
	F: "FMS ",
	G: "IGS ",
	I: "ILS ",
	J: "GLS ",
	M: "MLS ",
	N: "NDB ",
	P: "GPS ",
	Q: "NDB DME ",
	R: "RNAV ",
	V: "VOR ",
};

function convertApproachId(id: string): string {
	return id.replace(/^[A-Z]/, (ch) => APPROACH_PREFIX[ch] ?? ch).replace(/([XYZ])$/, " $1");
}
