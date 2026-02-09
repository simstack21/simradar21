import OMap from "@/app/(map)/components/Map";
import Header from "@/components/Header/Header";
import PanelGrid from "@/components/Panel/PanelGrid";
import ActiveFilters from "./components/ActiveFilters";
import Footer from "./components/Footer/Footer";

export default function MapLayout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<Header />
			<PanelGrid>{children}</PanelGrid>
			<ActiveFilters />
			<OMap />
			<Footer />
		</>
	);
}
