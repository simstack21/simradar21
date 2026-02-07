import Flights from "../../components/Flights/Flights";

export default async function AircraftsLayout(
	props: Readonly<{
		children: React.ReactNode;
		params: Promise<{ reg: string }>;
	}>,
) {
	const registration = (await props.params).reg;
	const { children } = props;

	return (
		<div className="container mx-auto py-10">
			<Flights registration={registration} />
			{children}
		</div>
	);
}
