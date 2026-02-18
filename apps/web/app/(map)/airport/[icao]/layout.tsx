import AirportLayout from "../../components/Panels/Airport/AirportLayout";

export default async function Layout(
	props: Readonly<{
		children: React.ReactNode;
		params: Promise<{ icao: string }>;
	}>,
) {
	const params = await props.params;
	const { children } = props;

	return <AirportLayout icao={params.icao}>{children}</AirportLayout>;
}
