import type { StaticAirport } from "@sr24/types/db";
import type { PilotLong } from "@sr24/types/interface";
import type { NavigraphAirport, NavigraphProcedure } from "@sr24/types/navigraph";
import { PlaneLandingIcon, PlaneTakeoffIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { mapService } from "@/app/(map)/lib";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getCachedAirport } from "@/storage/cache";
import { dxGetNavigraphAirport, dxGetNavigraphProceduresByAirport } from "@/storage/dexie";

export default function PilotProcedures({ pilot }: { pilot: PilotLong }) {
	return (
		<ScrollArea className="max-h-full overflow-hidden flex flex-col">
			{pilot.flight_plan?.departure.icao && <ProcedureCard pilot={pilot} type="departure" />}
			{pilot.flight_plan?.arrival.icao && <ProcedureCard pilot={pilot} type="arrival" />}
			<ScrollBar />
		</ScrollArea>
	);
}

function ProcedureCard({ pilot, type }: { pilot: PilotLong; type: "departure" | "arrival" }) {
	const [staticAirport, setStaticAirport] = useState<StaticAirport | null>(null);
	const [procedures, setProcedures] = useState<DepartureProcedures | ArrivalProcedures | null>(null);
	const [parsedProc, setParsedProc] = useState(type === "departure" ? pilot.flight_plan?.parsed_route?.sid : pilot.flight_plan?.parsed_route?.star);

	const initRef = useRef<string | null>(null);

	useEffect(() => {
		const icao = pilot.flight_plan?.[type].icao;
		if (!icao || initRef.current === icao) return;
		initRef.current = icao;

		getCachedAirport(icao).then(setStaticAirport);
		if (type === "departure") {
			getDepartureProcedures(icao).then(setProcedures);
		} else {
			getArrivalProcedures(icao).then(setProcedures);
		}
	}, [pilot.flight_plan, type]);

	const onProcChange = useCallback(
		(key: "rwy" | "proc" | "trans", value: string | null) => {
			if (!parsedProc || !pilot.flight_plan?.parsed_route) return;

			const updated: typeof parsedProc = { ...parsedProc, override: true };

			// If dep rwy change, update rwy connection or swap procedure to completely different departure with same id
			if (type === "departure" && key === "rwy") {
				const sidProcedures = procedures as DepartureProcedures;
				const procPrefix = parsedProc.proc?.split(":").slice(0, -1).join(":");
				const newRwyConn = sidProcedures.rwyConnections.find((conn) => conn.uid === `${procPrefix}:${value}`);
				updated.rwyCon = newRwyConn?.uid || null;
			}

			// If proc change and runway specific, also update rwy
			const lastPart = value?.split(":").slice(-1)[0];
			if (type === "departure" && key === "proc" && lastPart?.startsWith("RW")) {
				updated.rwy = lastPart;
				updated.rwyCon = null;
			}

			// If proc change and not runway specific, check for runway connection or clear rwy connection
			if (type === "departure" && key === "proc" && !lastPart?.startsWith("RW")) {
				const sidProcedures = procedures as DepartureProcedures;
				const procPrefix = value?.split(":").slice(0, -1).join(":");
				const newRwyConn = sidProcedures.rwyConnections.find((conn) => conn.uid === `${procPrefix}:${updated.rwy}`);
				updated.rwyCon = newRwyConn?.uid || null;
			}

			updated[key] = value || null;
			setParsedProc(updated);

			const newParsedRoute =
				type === "departure" ? { ...pilot.flight_plan.parsed_route, sid: updated } : { ...pilot.flight_plan.parsed_route, star: updated };
			mapService.setFeatures({ autoTrackId: pilot.id, route: newParsedRoute });
		},
		[parsedProc, procedures, pilot, type],
	);

	return (
		<Card size="sm" className="m-2 bg-muted/50">
			<CardHeader className="gap-0">
				<CardTitle className="flex items-center gap-2">
					{type === "departure" ? <PlaneTakeoffIcon size={16} /> : <PlaneLandingIcon size={16} />}
					<span>{staticAirport?.id || pilot.flight_plan?.[type].icao}</span>
					<Badge variant={parsedProc?.override ? "secondary" : "outline"} className="ml-auto">
						{parsedProc?.override ? "Manually Set" : "Auto Detected"}
					</Badge>
				</CardTitle>
				<CardDescription>{staticAirport?.name || "Unknown"}</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col gap-1">
				{procedures?.rwys && procedures.rwys.length > 0 && (
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
				{procedures?.procedures && procedures.procedures.length > 0 && (
					<div className="flex flex-col gap-0.5">
						<div className="flex items-center gap-2">
							<span className={cn("h-2 w-2 rounded-xs shrink-0", type === "departure" ? "bg-[#dc649f]" : "bg-[#98ca7f]")} />
							<span className="text-xs">{type === "departure" ? "SID" : "STAR"}</span>
						</div>
						<Select items={procedures.procedures} value={parsedProc?.proc} onValueChange={(value) => onProcChange("proc", value)}>
							<SelectTrigger className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									<SelectLabel>{type === "departure" ? "SID Selection" : "STAR Selection"}</SelectLabel>
									{procedures.procedures.map((proc) => (
										<SelectItem key={proc.value} value={proc.value}>
											{proc.label}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>
					</div>
				)}
				{procedures?.transitions && procedures.transitions.length > 0 && (
					<div className="flex flex-col gap-0.5">
						<div className="flex items-center gap-2">
							<span className={cn("h-2 w-2 rounded-xs shrink-0", type === "departure" ? "bg-[#dc649f]" : "bg-[#98ca7f]")} />
							<span className="text-xs">Transition</span>
						</div>
						<Select items={procedures.transitions} value={parsedProc?.trans} onValueChange={(value) => onProcChange("trans", value)}>
							<SelectTrigger className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									<SelectLabel>{type === "departure" ? "SID Transition Selection" : "STAR Transition Selection"}</SelectLabel>
									{procedures.transitions.map((proc) => (
										<SelectItem key={proc.value} value={proc.value}>
											{proc.label}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>
					</div>
				)}
				{(procedures as ArrivalProcedures)?.approaches && (procedures as ArrivalProcedures).approaches.length > 0 && (
					<div className="flex flex-col gap-0.5">
						<div className="flex items-center gap-2">
							<span className="h-2 w-2 rounded-xs shrink-0 bg-[#f3ac7a]" />
							<span className="text-xs">Approach</span>
						</div>
						<Select items={(procedures as ArrivalProcedures)?.approaches}>
							<SelectTrigger className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									<SelectLabel>Approach Selection</SelectLabel>
									{(procedures as ArrivalProcedures)?.approaches.map((proc) => (
										<SelectItem key={proc.value} value={proc.value}>
											{proc.label}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>
					</div>
				)}
				{(procedures as ArrivalProcedures)?.appTransitions && (procedures as ArrivalProcedures).appTransitions.length > 0 && (
					<div className="flex flex-col gap-0.5">
						<div className="flex items-center gap-2">
							<span className="h-2 w-2 rounded-xs shrink-0 bg-[#f3ac7a]" />
							<span className="text-xs">Approach Transition</span>
						</div>
						<Select items={(procedures as ArrivalProcedures)?.appTransitions}>
							<SelectTrigger className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									<SelectLabel>Approach Transition Selection</SelectLabel>
									{(procedures as ArrivalProcedures)?.appTransitions.map((proc) => (
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

type SelectProps = {
	value: string | null;
	label: string;
};

type DepartureProcedures = {
	rwys: SelectProps[];
	rwyConnections: NavigraphProcedure[];
	procedures: SelectProps[];
	transitions: SelectProps[];
};

type ArrivalProcedures = {
	rwys: SelectProps[];
	rwyConnections?: NavigraphProcedure[];
	procedures: SelectProps[];
	transitions: SelectProps[];
	approaches: SelectProps[];
	appTransitions: SelectProps[];
};

async function getDepartureProcedures(icao: string): Promise<DepartureProcedures> {
	const airport = await dxGetNavigraphAirport(icao);
	const allProcedures = await dxGetNavigraphProceduresByAirport("sids", icao);

	const { procedures, rwyConnections } = parseProcedures(allProcedures);

	return {
		rwys: parseRunways(airport),
		rwyConnections,
		procedures,
		transitions: parseTransitions(allProcedures),
	};
}

async function getArrivalProcedures(icao: string): Promise<ArrivalProcedures> {
	const airport = await dxGetNavigraphAirport(icao);
	const allProcedures = await dxGetNavigraphProceduresByAirport("stars", icao);
	console.log(allProcedures);

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
	const seenTrans = new Set<string>();
	const transProcs = allProcedures
		.filter((proc) => !proc.uid.split(":")[2].startsWith("RW") && !proc.uid.split(":")[2].startsWith("ALL"))
		.filter((proc) => (seenTrans.has(proc.id) ? false : seenTrans.add(proc.id)));

	const transitions: SelectProps[] = [{ value: null, label: "None" }];
	transProcs.forEach((proc) => void transitions.push({ value: proc.uid, label: `${proc.uid.split(":")[2]} (${proc.id})` }));

	return transitions;
}

function parseRunways(airport: NavigraphAirport | undefined): SelectProps[] {
	const runways: SelectProps[] = [{ value: null, label: "None" }];
	airport?.runways.forEach((rw) => void runways.push({ value: rw.id, label: rw.id }));
	return runways;
}
