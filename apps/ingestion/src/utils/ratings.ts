import type { UserRatings } from "@sr24/types/interface";
import type { VatsimMemberDetails, VatsimMemberHours } from "@sr24/types/vatsim";
import axios from "axios";
import pLimit from "p-limit";

const limit = pLimit(20);
const TIMEOUT_MS = 60_000;
const MAX_CONSECUTIVE_TIMEOUTS = 3;
const COOLDOWN_MS = 10 * 60_000;

let consecutiveTimeouts = 0;
let coolingDownUntil = 0;

export async function getUserRatings(cids: string[]): Promise<Map<string, UserRatings>> {
	if (Date.now() < coolingDownUntil) {
		console.warn("Skipping members fetch. Timed out multiple times.");
		return new Map();
	}

	const ratings: Map<string, UserRatings> = new Map();

	const work = Promise.all(
		cids.map((cid) =>
			limit(async () => {
				try {
					ratings.set(cid, await getUserRatingByCid(cid));
				} catch {
					// console.warn(`Failed to fetch ratings for ${cid}:`, err instanceof Error ? err.message : err);
				}
			}),
		),
	);

	const timeout = new Promise<void>((_, reject) => setTimeout(() => reject(new Error(`getUserRatings timed out after ${TIMEOUT_MS}ms`)), TIMEOUT_MS));

	try {
		await Promise.race([work, timeout]);
		consecutiveTimeouts = 0;
	} catch {
		consecutiveTimeouts++;
		console.warn("Members fetch timed out.");

		if (consecutiveTimeouts >= MAX_CONSECUTIVE_TIMEOUTS) {
			coolingDownUntil = Date.now() + COOLDOWN_MS;
			consecutiveTimeouts = 0;
			console.warn("Too many timeouts — pausing members fetches for 10 minutes.");
		}
	}

	return ratings;
}

async function getUserRatingByCid(cid: string): Promise<UserRatings> {
	const [hours, details] = await Promise.all([
		axios.get<VatsimMemberHours>(`https://api.vatsim.net/v2/members/${cid}/stats`).then((res) => res.data),
		axios.get<VatsimMemberDetails>(`https://api.vatsim.net/v2/members/${cid}`).then((res) => res.data),
	]);

	return {
		pilot_rating: details.pilotrating,
		military_rating: details.militaryrating,
		controller_rating: details.rating,
		pilot_hours: Math.round(hours.pilot),
		controller_hours: Math.round(hours.atc),
	};
}
