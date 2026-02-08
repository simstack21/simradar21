import Aircraft from "../../components/Flights/Aircraft";
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
		<div className="flex flex-col container mx-auto py-10 gap-4">
			<Aircraft registration={registration} />
			<Flights registration={registration} />
			{children}
		</div>
	);
}
