import type { FIRFeature, SimAwareTraconFeature } from "@sr24/types/db";

export interface SectorPanelData {
	feature: SimAwareTraconFeature | FIRFeature | null;
	type: "tracon" | "fir" | null;
}
