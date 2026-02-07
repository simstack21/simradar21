import OMap from "@/app/(map)/components/Map";
import Header from "@/components/Header/Header";
import Initializer from "@/components/Initializer/Initializer";
import BasePanel from "@/components/Panel/BasePanel";
import ActiveFilters from "./components/ActiveFilters";
import Footer from "./components/Footer/Footer";

export default function MapLayout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<Header />
			<Initializer />
			<BasePanel>{children}</BasePanel>
			<ActiveFilters />
			<OMap />
			<Footer />
		</>
	);
}
