import Flights from "../../components/Flights/Flights";

export default async function FlightsLayout(
	props: Readonly<{
		children: React.ReactNode;
		params: Promise<{ callsign: string }>;
	}>,
) {
	const callsign = (await props.params).callsign;
	const { children } = props;

	return (
		<div className="container mx-auto py-10">
			<Flights callsign={callsign} />
			{children}
		</div>
	);
}
