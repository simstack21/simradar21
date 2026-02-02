"use client";

import { useSearchParams } from "next/navigation";
import DashboardPanel from "../../components/Panels/Dashboard/DashboardPanel";
import MultiPanel from "../components/MultiPanel";

export default function Page() {
	const params = useSearchParams();
	const selected = params.get("selected") || "";
	const ids = selected.split(",");

	if (ids.length === 0) return <DashboardPanel />;
	return <MultiPanel ids={ids} />;
}
