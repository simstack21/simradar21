import Header from "@/components/Header/Header";
import Initializer from "@/components/Initializer/Initializer";
import { BreadCrumbWithDropdown } from "@/components/shared/Breadcrumb";

export default function DataLayout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<Header />
			<Initializer />
			<main className="flex flex-col gap-8 p-8 sm:p-16 pt-20 sm:pt-20 grow">
				<BreadCrumbWithDropdown />
				{children}
			</main>
		</>
	);
}
