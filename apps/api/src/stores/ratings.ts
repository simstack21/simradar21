import type { UserRatings } from "@sr24/types/interface";
import type { VatsimMemberDetails, VatsimMemberHours } from "@sr24/types/vatsim";
import axios from "axios";

type RatingsCacheValues = [number, number, number, number, number];
type RatingsCacheEntry = {
	values: RatingsCacheValues;
	timestamp: number;
};

const axiosInstance = axios.create({
	headers: {
		"x-identifier": process.env.VATSIM_API_IDENTIFIER || "simradar21-unknown",
		"User-Agent": "simradar21/1.0",
	},
});

const CACHE_DURATION = 6 * 60 * 60 * 1000;
const ratingsCache = new Map<string, RatingsCacheEntry>();

export async function getMemberRatingByCid(cid: string): Promise<UserRatings> {
	const cached = ratingsCache.get(cid);
	const now = Date.now();

	if (cached && now - cached.timestamp < CACHE_DURATION) {
		const [pilot_rating, military_rating, controller_rating, pilot_hours, controller_hours] = cached.values;
		return { pilot_rating, military_rating, controller_rating, pilot_hours, controller_hours };
	}

	const [hours, details] = await Promise.all([
		axiosInstance.get<VatsimMemberHours>(`https://api.vatsim.net/v2/members/${cid}/stats`).then((res) => res.data),
		axiosInstance.get<VatsimMemberDetails>(`https://api.vatsim.net/v2/members/${cid}`).then((res) => res.data),
	]);

	const ratings: UserRatings = {
		pilot_rating: details.pilotrating,
		military_rating: details.militaryrating,
		controller_rating: details.rating,
		pilot_hours: Math.round(hours.pilot),
		controller_hours: Math.round(hours.atc),
	};
	const values: RatingsCacheValues = [details.pilotrating, details.militaryrating, details.rating, Math.round(hours.pilot), Math.round(hours.atc)];
	ratingsCache.set(cid, { values, timestamp: Date.now() });

	return ratings;
}
