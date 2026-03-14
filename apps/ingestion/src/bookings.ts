import { rdsPub } from "@sr24/db/redis";
import type { Booking } from "@sr24/types/interface";
import type { VatsimBooking } from "@sr24/types/vatsim";
import axios from "axios";
import { findFirId, findTraconId, parseAirportFacility, reduceCallsign } from "./utils/prefixes.js";

const UPDATE_INTERVAL = 10 * 60 * 1000;
let lastUpdate = 0;

export async function updateBookingsData(): Promise<void> {
	const now = Date.now();
	if (now - lastUpdate < UPDATE_INTERVAL) return;

	const bookings = await axios.get<VatsimBooking[]>("https://atc-bookings.vatsim.net/api/booking").then((res) => res.data);
	const parsedBookings = parseBookings(bookings);

	const twoDaysFromNow = now + 2 * 24 * 60 * 60 * 1000;
	const oneDayAgo = now - 1 * 24 * 60 * 60 * 1000;
	const limitedBookings = parsedBookings.filter((booking) => {
		const bookingStart = new Date(booking.start).getTime();
		return bookingStart <= twoDaysFromNow && bookingStart >= oneDayAgo;
	});

	const sortedBookings = limitedBookings.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

	rdsPub("data:bookings", sortedBookings);
	lastUpdate = now;
}

function parseBookings(bookings: VatsimBooking[]): Booking[] {
	const parsed: Booking[] = [];

	for (const booking of bookings) {
		let id: string | null = null;
		let facility: Booking["facility"] | null = null;

		const callsign = booking.callsign.toUpperCase();
		const levels = reduceCallsign(callsign);

		if (callsign.endsWith("_TWR") || callsign.endsWith("_GND") || callsign.endsWith("_DEL") || callsign.endsWith("_ATIS")) {
			id = levels[levels.length - 1];
			facility = parseAirportFacility(callsign);
		} else if (callsign.endsWith("_APP") || callsign.endsWith("_DEP")) {
			id = findTraconId(callsign);
			if (!id) {
				id = levels[levels.length - 1];
			}
			facility = 5;
		} else {
			id = findFirId(callsign);
			facility = 6;
		}

		if (!id || facility === null) continue;

		const bookingEntry: Booking = {
			id,
			facility,
			callsign: booking.callsign,
			type: booking.type,
			start: booking.start.endsWith("Z") ? booking.start : `${booking.start}Z`,
			end: booking.end.endsWith("Z") ? booking.end : `${booking.end}Z`,
		};
		parsed.push(bookingEntry);
	}

	return parsed;
}
