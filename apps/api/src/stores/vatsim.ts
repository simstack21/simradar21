import { rdsSetSingle, rdsSub } from "@sr24/db/redis";
import type {
	AirportLong,
	ControllerLong,
	ControllerMerged,
	DashboardData,
	InitialData,
	PilotLong,
	PilotParsedRoute,
	RedisAll,
} from "@sr24/types/interface";

class MapStore {
	init: InitialData | null = null;
	dashboard: DashboardData | null = null;
	pilots = new Map<string, PilotLong>();
	controllers = new Map<string, ControllerLong>();
	airports = new Map<string, AirportLong>();
	merged: ControllerMerged[] = [];

	async start() {
		await rdsSub("data:all", (data) => {
			const parsed: RedisAll = JSON.parse(data);
			this.init = parsed.init;
			this.dashboard = parsed.dashboard;

			this.pilots.clear();
			parsed.pilots.forEach((p) => {
				this.pilots.set(p.id, p);
			});

			this.controllers.clear();
			parsed.controllers.forEach((c) => {
				this.controllers.set(c.callsign, c);
			});

			this.airports.clear();
			parsed.airports.forEach((a) => {
				this.airports.set(a.icao, a);
			});

			this.merged = parsed.init.controllers;
		});
	}

	getControllersByCallsign(callsign: string, type: "airport" | "sector"): ControllerLong[] {
		if (type === "airport") {
			const ids = this.merged.filter((c) => c.id === `airport_${callsign}`).flatMap((c) => c.controllers.map((ctl) => ctl.callsign));
			return ids.map((id) => this.controllers.get(id)).filter((controller) => controller !== undefined);
		}

		const firIds = this.merged.filter((c) => c.id === `fir_${callsign}`).flatMap((c) => c.controllers.map((ctl) => ctl.callsign));
		if (firIds.length > 0) {
			return firIds.map((id) => this.controllers.get(id)).filter((controller) => controller !== undefined);
		} else {
			const ids = this.merged.filter((c) => c.id === `tracon_${callsign}`).flatMap((c) => c.controllers.map((ctl) => ctl.callsign));
			return ids.map((id) => this.controllers.get(id)).filter((controller) => controller !== undefined);
		}
	}

	getArrivingPilotsIds(icao: string, limit?: number): string[] {
		const pilots = Array.from(this.pilots.values())
			.filter(
				(pilot) =>
					pilot.flight_plan?.arrival?.icao === icao &&
					pilot.times?.sched_on_block !== undefined &&
					pilot.times.state !== "On Block" &&
					pilot.times.state !== "Taxi In" &&
					pilot.live === "live",
			)
			.sort((a, b) => (a.times?.on_block ?? 0) - (b.times?.on_block ?? 0))
			.map((pilot) => pilot.id);
		return limit ? pilots.slice(0, limit) : pilots;
	}

	async setPilotModifiedRoute(id: string, modifiedRoute: PilotParsedRoute) {
		const pilot = this.pilots.get(id);
		if (!pilot || !pilot.flight_plan) return;

		pilot.overrides = pilot.overrides || {};
		pilot.overrides.modifiedRoute = modifiedRoute;

		await rdsSetSingle(`pilot:${id}`, pilot, 12 * 60 * 60);
	}
}

export const mapStore = new MapStore();
await mapStore.start();
