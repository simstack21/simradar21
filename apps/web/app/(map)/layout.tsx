import OMap from "@/app/(map)/components/Map";
import Header from "@/components/Header/Header";
import Footer from "./components/Footer/Footer";
import BasePanel from "./components/Panels/BasePanel";

export default function MapLayout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<Header />
			<BasePanel>{children}</BasePanel>
			<OMap />
			<Footer />
		</>
	);
}
