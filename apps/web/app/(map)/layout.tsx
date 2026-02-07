import OMap from "@/app/(map)/components/Map";
import Header from "@/components/Header/Header";
import Footer from "./components/Footer/Footer";

export default function MapLayout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<Header />
			<OMap>{children}</OMap>
			<Footer />
		</>
	);
}
