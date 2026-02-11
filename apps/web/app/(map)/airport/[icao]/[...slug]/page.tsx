import AirportFlights from "@/components/Panel/Airport/AirportFlights";

export default async function Page(props: { params: Promise<{ icao: string; slug: string[] }> }) {
	const params = await props.params;
	const direction = normalizeDirection(params.slug[0]);
	return <AirportFlights icao={params.icao} direction={direction} />;
}

function normalizeDirection(direction: string): "departure" | "arrival" {
	const d = direction.toLowerCase();
	return d.startsWith("arrival") ? "arrival" : "departure";
}
