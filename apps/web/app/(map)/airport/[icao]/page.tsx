import AirportPanel from "../../components/Panels/Airport/AirportPanel";

export default async function Page(props: { params: Promise<{ icao: string }> }) {
	const params = await props.params;
	return <AirportPanel icao={params.icao} />;
}
