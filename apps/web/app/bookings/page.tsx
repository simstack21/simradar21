import Header from "@/components/Header/Header";
import Initializer from "@/components/Initializer/Initializer";
import Bookings from "./components/Bookings";

export default async function Page() {
	return (
		<>
			<Header />
			<Initializer />
			<Bookings />
		</>
	);
}
