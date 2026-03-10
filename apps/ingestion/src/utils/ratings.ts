import type { UserRatings } from "@sr24/types/interface";
import type { VatsimMemberDetails, VatsimMemberHours } from "@sr24/types/vatsim";
import axios from "axios";

const BATCH_SIZE = 5;
const BATCH_DELAY_MS = 2000;

export async function getUserRatings(cids: string[]): Promise<Record<string, UserRatings>> {
	const ratings: Record<string, UserRatings> = {};
	for (let i = 0; i < cids.length; i += BATCH_SIZE) {
		const batch = cids.slice(i, i + BATCH_SIZE);
		await Promise.all(
			batch.map(async (cid) => {
				ratings[cid] = await getUserRatingByCid(cid);
			}),
		);
		if (i + BATCH_SIZE < cids.length) {
			await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
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
		pilot_hours: hours.pilot,
		controller_hours: hours.atc,
	};
}
