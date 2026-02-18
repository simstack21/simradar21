import type { PilotLong } from "@sr24/types/interface";
import { fetchApi } from "@/lib/api";
import type { HistoryItem, PilotMatch, PilotResult } from "./types";

const SEARCH_HISTORY_KEY = "simradar21-search-history";
const MAX_HISTORY = 10;

export async function fetchPilots(query: string, path?: "routes" | "users"): Promise<PilotResult> {
	const pilots = await fetchApi<PilotResult>(`/search${path ? `/${path}` : ""}?q=${encodeURIComponent(query)}`);
	return pilots;
}

export function getSearchHistory(): HistoryItem[] {
	if (typeof window === "undefined") return [];
	try {
		return JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) || "[]");
	} catch {
		return [];
	}
}

export function addSearchHistory(item: HistoryItem) {
	if (!item.value.trim()) return;

	const history = getSearchHistory().filter((historyItem) => historyItem.value.toLowerCase() !== item.value.toLowerCase());
	history.unshift(item);
	localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
}

export function removeSearchHistory(value: string) {
	const history = getSearchHistory().filter((item) => item.value.toLowerCase() !== value.toLowerCase());
	localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
}

export function getPilotMatchFields(pilot: PilotLong, query: string): PilotMatch {
	const lowerQuery = query.toLowerCase();

	const match: PilotMatch = {};

	if (pilot.cid.toString().includes(lowerQuery)) match.cid = pilot.cid.toString();
	if (pilot.name.toLowerCase().includes(lowerQuery)) match.name = pilot.name;

	return match;
}

export function highlightMatch(text: string, query: string): React.ReactNode {
	if (!query) return text;

	const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
	const parts = text.split(regex);

	return parts.map((part, i) =>
		regex.test(part) ? (
			<span key={i} className="font-bold text-primary">
				{part}
			</span>
		) : (
			part
		),
	);
}
