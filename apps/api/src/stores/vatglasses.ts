import type { VatglassesDynamicOwnership } from "@sr24/types/db";
import axios from "axios";

const VATGLASSES_OWNERSHIP_URL = "https://api3.vatglasses.uk/live/activeOwnership";

let cached: VatglassesDynamicOwnership | null = null;
let timestamp = 0;

export async function getVatglassesDynamicOwnership(): Promise<VatglassesDynamicOwnership | null> {
	if (!cached || Date.now() - timestamp > 60_000) {
		try {
			const res = await axios.get<VatglassesDynamicOwnership>(VATGLASSES_OWNERSHIP_URL, { timeout: 10_000 });
			cached = res.data;
			timestamp = Date.now();
		} catch {
			// return stale
		}
	}

	return cached;
}
