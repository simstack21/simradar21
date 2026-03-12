import type { ControllerDelta, ControllerLong, ControllerMerged, ControllerShort, PilotLong } from "@sr24/types/interface";
import type { VatsimData } from "@sr24/types/vatsim";
import { haversineDistance } from "./utils/helpers.js";
import { getUserRatings } from "./utils/ratings.js";
import { findPrefixMatch, reduceCallsign } from "./utils/sectors.js";

let cachedLongs: ControllerLong[] = [];
let cached: ControllerMerged[] = [];
let updated: ControllerMerged[] = [];
let added: ControllerMerged[] = [];

export async function mapControllers(vatsimData: VatsimData, pilotsLong: PilotLong[]): Promise<[ControllerLong[], ControllerMerged[]]> {
	const controllersLong: ControllerLong[] = vatsimData.controllers
		.map((controller) => {
			if (controller.facility === 0 && !controller.callsign.includes("OBS")) return null;
			if (controller.frequency === "199.998") return null;

			const cachedController = cachedLongs.find((c) => c.cid === String(controller.cid));
			return {
				callsign: controller.callsign,
				frequency: parseFrequencyToKHz(controller.frequency),
				facility: controller.facility,
				atis: controller.text_atis,
				connections: 0,
				cid: String(controller.cid),
				name: controller.name,
				server: controller.server,
				visual_range: controller.visual_range,
				user_ratings: cachedController?.user_ratings || null,
				logon_time: new Date(controller.logon_time).getTime(),
				timestamp: new Date(controller.last_updated).getTime(),
			};
		})
		.filter((c) => c !== null);

	getConnectionsCount(vatsimData, controllersLong, pilotsLong);

	const uniqueCids = Array.from(new Set(controllersLong.filter((c) => c.user_ratings === null).map((c) => c.cid)));
	const userRatings = await getUserRatings(uniqueCids);
	for (const controller of controllersLong) {
		const ratings = userRatings.get(controller.cid);
		if (ratings) {
			controller.user_ratings = ratings;
		}
	}

	vatsimData.atis.forEach((atis) => {
		controllersLong.push({
			callsign: atis.callsign,
			frequency: parseFrequencyToKHz(atis.frequency),
			facility: -1,
			atis: atis.text_atis,
			connections: 0,
			cid: String(atis.cid),
			name: atis.name,
			server: atis.server,
			visual_range: atis.visual_range,
			user_ratings: null,
			logon_time: new Date(atis.logon_time).getTime(),
			timestamp: new Date(atis.last_updated).getTime(),
		});
	});

	const merged = await mergeControllers(controllersLong);
	setControllerDelta(merged);

	cachedLongs = controllersLong;

	return [controllersLong, merged];
}

function setControllerDelta(merged: ControllerMerged[]): void {
	added = [];
	updated = [];

	for (const m of merged) {
		const cachedMerged = cached.find((c) => c.id === m.id);
		if (!cachedMerged) {
			added.push(m);
		} else {
			const updatedControllers: ControllerShort[] = [];

			for (const controller of m.controllers) {
				const cachedController = cachedMerged.controllers.find((c) => c.callsign === controller.callsign);
				const controllerShort = getControllerShort(controller, cachedController);
				updatedControllers.push(controllerShort);
			}

			if (updatedControllers.length > 0) {
				updated.push({
					id: m.id,
					facility: m.facility,
					controllers: updatedControllers,
				});
			}
		}
	}

	cached = merged;
}

function getControllerShort(controller: ControllerShort, cachedController?: ControllerShort): ControllerShort {
	if (!cachedController) {
		return {
			callsign: controller.callsign,
			frequency: controller.frequency,
			facility: controller.facility,
			atis: controller.atis,
			logon_time: controller.logon_time,
			connections: controller.connections,
		};
	} else {
		const controllerShort: ControllerShort = { callsign: controller.callsign, facility: controller.facility };

		if (controller.frequency !== cachedController.frequency) controllerShort.frequency = controller.frequency;
		if (JSON.stringify(controller.atis) !== JSON.stringify(cachedController.atis)) controllerShort.atis = controller.atis;
		if (controller.connections !== cachedController.connections) controllerShort.connections = controller.connections;

		return controllerShort;
	}
}

export function getControllerDelta(): ControllerDelta {
	return {
		added,
		updated,
	};
}

// "122.800" ==> 122800
function parseFrequencyToKHz(freq: string): number {
	const num = Number(freq.replace(".", ""));
	if (Number.isNaN(num)) return 122_800;

	return num;
}

function getConnectionsCount(vatsimData: VatsimData, controllersLong: ControllerLong[], pilotsLong: PilotLong[]) {
	const controllersByFreq = new Map<number, ControllerLong[]>();

	for (const controllerLong of controllersLong) {
		const freq = controllerLong.frequency;

		if (!controllersByFreq.has(freq)) {
			controllersByFreq.set(freq, []);
		}
		controllersByFreq.get(freq)?.push(controllerLong);
	}

	const pilotsByFreq = new Map<number, PilotLong[]>();
	for (const pilotLong of pilotsLong) {
		const freq = pilotLong.frequency;

		if (!pilotsByFreq.has(freq)) {
			pilotsByFreq.set(freq, []);
		}
		pilotsByFreq.get(freq)?.push(pilotLong);
	}

	for (const [freq, controllerList] of controllersByFreq.entries()) {
		const pilotList = pilotsByFreq.get(freq) || [];

		if (controllerList.length === 1) {
			controllerList[0].connections = pilotList.length;
		} else {
			for (const pilot of pilotList) {
				let closestController = controllerList[0];
				let minDist = Infinity;

				for (const controller of controllerList) {
					const transceiverData = vatsimData.transceivers.find((t) => t.callsign === controller.callsign);
					const transceiverByFreq = transceiverData?.transceivers.find((t) => Number(t.frequency.toString().slice(0, 6)) === freq);
					if (!transceiverByFreq) continue;

					const dist = haversineDistance([pilot.latitude, pilot.longitude], [transceiverByFreq.latDeg, transceiverByFreq.lonDeg]);
					if (dist < minDist) {
						minDist = dist;
						closestController = controller;
					}
				}

				closestController.connections++;
			}
		}
	}
}

async function mergeControllers(controllersLong: ControllerLong[]): Promise<ControllerMerged[]> {
	const merged = new Map<string, ControllerMerged>();

	for (const c of controllersLong) {
		let id: string | null = null;
		let facility: ControllerMerged["facility"] | null = null;

		const levels = reduceCallsign(c.callsign);

		if (c.facility === 6 || c.facility === 1) {
			// FIR
			id = findPrefixMatch(levels, 6);
			facility = "fir";
		} else if (c.facility === 5) {
			// TRACON
			id = findPrefixMatch(levels, 5);
			// Fallback for circle tracon controllers
			if (!id) {
				id = levels[levels.length - 1];
			}
			facility = "tracon";
		} else {
			// Airport: simply take the first segment
			id = levels[levels.length - 1];
			facility = "airport";
		}

		if (!id) continue;

		const controllerShort: ControllerShort = {
			callsign: c.callsign,
			frequency: c.frequency,
			facility: c.facility,
			atis: c.atis,
			logon_time: c.logon_time,
			connections: c.connections,
		};

		id = facility === "fir" ? `fir_${id}` : facility === "tracon" ? `tracon_${id}` : `airport_${id}`;

		const existing = merged.get(id);
		if (existing) {
			existing.controllers.push(controllerShort);
		} else {
			merged.set(id, {
				id,
				facility,
				controllers: [controllerShort],
			});
		}
	}

	return Array.from(merged.values());
}
