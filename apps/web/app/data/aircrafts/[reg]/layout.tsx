import Aircraft from "../../components/Flights/Aircraft";
import FlightsTable from "../../components/Flights/FlightsTable";

export default async function AircraftsLayout(
	props: Readonly<{
		children: React.ReactNode;
		params: Promise<{ reg: string }>;
	}>,
) {
	const registration = (await props.params).reg;
	const { children } = props;

	return (
		<div className="flex flex-col container mx-auto py-10 gap-4">
			<Aircraft registration={registration} />
			<FlightsTable registration={registration} />
			{children}
		</div>
	);
}
