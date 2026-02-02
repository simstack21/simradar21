"use client";

import MultiAirportPanel from "./MultiAirportPanel";
import MultiPilotPanel from "./MultiPilotPanel";
import MultiSectorPanel from "./MultiSectorPanel";
import "./MultiPanel.css";

export default function MultiPanel({ ids }: { ids: string[] }) {
	return (
		<div id="multi-panel">
			{ids.map((fullId) => {
				const [type, id] = fullId.split(/_(.+)/);
				if (!type || !id) return null;

				if (type === "pilot") return <MultiPilotPanel key={fullId} id={id} />;
				if (type === "airport") return <MultiAirportPanel key={fullId} id={id} />;
				if (type === "sector") return <MultiSectorPanel key={fullId} id={id} />;

				return null;
			})}
		</div>
	);
}
