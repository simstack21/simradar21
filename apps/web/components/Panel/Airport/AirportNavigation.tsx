import { usePathname, useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AirportNavigation({ icao }: { icao: string }) {
	const pathname = usePathname();
	const router = useRouter();

	const subPath = pathname.replace(`/airport/${icao}`, "") || "/";

	return (
		<Tabs value={subPath} onValueChange={(value) => router.push(`/airport/${icao}${value}`)}>
			<TabsList variant="line" className="w-full">
				<TabsTrigger value="/">Overview</TabsTrigger>
				<TabsTrigger value="/departures">Departures</TabsTrigger>
				<TabsTrigger value="/arrivals">Arrivals</TabsTrigger>
			</TabsList>
		</Tabs>
	);
}
