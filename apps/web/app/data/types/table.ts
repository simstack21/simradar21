export type Flight = {
	id: string;
	date: number | undefined;
	callsign: string;
	registration: string | undefined | null;
	departure: string | undefined;
	arrival: string | undefined;
	aircraft: string;
	status: "live" | "off" | "pre";
	std: number | undefined;
	atd: number | undefined;
	sta: number | undefined;
	ata: number | undefined;
};
