import BreadCrumb from "@/components/Breadcrumb/Breadcrumb";
import Header from "@/components/Header/Header";
import Initializer from "@/components/Initializer/Initializer";

export default function DataLayout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<Header />
			<main id="data-page">
				<Initializer />
				<BreadCrumb />
				{children}
			</main>
		</>
	);
}
