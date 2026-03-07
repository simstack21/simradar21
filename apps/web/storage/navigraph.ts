import type { NavigraphPackage } from "@sr24/types/db";
import type { NavigraphDataset } from "@sr24/types/navigraph";

export interface NavigraphPackageSigned extends NavigraphPackage {
	url: string;
}

async function fetchPackage(): Promise<NavigraphPackageSigned | null> {
	const res = await fetch("/user/navigraph/packages");
	if (!res.ok) return null;
	return res.json();
}

async function downloadNavigraphData(pkg: NavigraphPackageSigned): Promise<NavigraphDataset> {
	const res = await fetch(pkg.url);
	if (!res.ok) throw new Error(`Failed to download Navigraph data ${pkg.id}: ${res.status}`);
	return res.json();
}

export async function ensureNavigraphData(storedCycle: string | undefined): Promise<{ dataset: NavigraphDataset; cycle: string } | null> {
	try {
		const pkg = await fetchPackage();
		if (!pkg || pkg.cycle === storedCycle) return null;

		return {
			dataset: await downloadNavigraphData(pkg),
			cycle: pkg.cycle,
		};
	} catch (err) {
		console.error("Navigraph: failed to fetch or download data", err);
		return null;
	}
}
