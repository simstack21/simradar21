const PILOT_RATINGS = [
	{
		id: 0,
		short_name: "Basic",
		long_name: "Basic Member",
		color: "border-muted text-gray bg-gray/10",
	},
	{
		id: 1,
		short_name: "PPL",
		long_name: "Private Pilot License",
		color: "bg-green/10 text-green border-green",
	},
	{
		id: 3,
		short_name: "IR",
		long_name: "Instrument Rating",
		color: "bg-green text-white border-muted",
	},
	{
		id: 7,
		short_name: "CMEL",
		long_name: "Commercial Multi-Engine License",
		color: "bg-blue text-white border-muted",
	},
	{
		id: 15,
		short_name: "ATPL",
		long_name: "Airline Transport Pilot License",
		color: "bg-pink-500 text-white border-muted",
	},
	{
		id: 31,
		short_name: "FI",
		long_name: "Flight Instructor",
		color: "bg-linear-to-r from-purple-500 to-pink-500 text-white border-white",
	},
	{
		id: 63,
		short_name: "FE",
		long_name: "Flight Examiner",
		color: "bg-linear-to-r from-purple-500 to-pink-500 text-white border-white",
	},
];

const MILITARY_RATINGS = [
	{
		id: 0,
		short_name: "M0",
		long_name: "No Military Rating",
		color: "bg-green/10 text-green border-green",
	},
	{
		id: 1,
		short_name: "M1",
		long_name: "Military Pilot License",
		color: "bg-green text-white border-muted",
	},
	{
		id: 3,
		short_name: "M2",
		long_name: "Military Instrument Rating",
		color: "bg-blue text-white border-muted",
	},
	{
		id: 7,
		short_name: "M3",
		long_name: "Military Multi-Engine Rating",
		color: "bg-pink-500 text-white border-white",
	},
	{
		id: 15,
		short_name: "M4",
		long_name: "Military Mission Ready Pilot",
		color: "bg-linear-to-r from-purple-500 to-pink-500 text-white border-white",
	},
];

const CONTROLLER_RATINGS = [
	{
		id: -1,
		short_name: "INAC",
		long_name: "Inactive",
		color: "border-gray text-gray bg-gray/10",
	},
	{
		id: 0,
		short_name: "SUS",
		long_name: "Suspended",
		color: "border-gray text-gray bg-gray/10",
	},
	{
		id: 1,
		short_name: "OBS",
		long_name: "Observer",
		color: "border-gray text-gray bg-gray/10",
	},
	{
		id: 2,
		short_name: "S1",
		long_name: "Tower Trainee",
		color: "bg-green/10 text-green border-green",
	},
	{
		id: 3,
		short_name: "S2",
		long_name: "Tower Controller",
		color: "bg-green text-white border-muted",
	},
	{
		id: 4,
		short_name: "S3",
		long_name: "Senior Student",
		color: "bg-green text-white border-muted",
	},
	{
		id: 5,
		short_name: "C1",
		long_name: "Enroute Controller",
		color: "bg-blue text-white border-muted",
	},
	{
		id: 6,
		short_name: "C2",
		long_name: "Controller 2 (not in use)",
		color: "bg-blue text-white border-muted",
	},
	{
		id: 7,
		short_name: "C3",
		long_name: "Senior Controller",
		color: "bg-blue text-white border-muted",
	},
	{
		id: 8,
		short_name: "I1",
		long_name: "Instructor",
		color: "bg-pink-500 text-white border-muted",
	},
	{
		id: 9,
		short_name: "I2",
		long_name: "Instructor 2 (not in use)",
		color: "bg-pink-500 text-white border-muted",
	},
	{
		id: 10,
		short_name: "I3",
		long_name: "Senior Instructor",
		color: "bg-pink-500 text-white border-muted",
	},
	{
		id: 11,
		short_name: "SUP",
		long_name: "Supervisor",
		color: "bg-linear-to-r from-purple-500 to-pink-500 text-white border-white",
	},
	{
		id: 12,
		short_name: "ADM",
		long_name: "Administrator",
		color: "bg-linear-to-r from-purple-500 to-pink-500 text-white border-white",
	},
];

export function getPilotRatingLong(id: number | undefined) {
	return PILOT_RATINGS.find((r) => r.id === id)?.long_name || "Unknown";
}

export function getControllerRatingLong(id: number | undefined) {
	return CONTROLLER_RATINGS.find((r) => r.id === id)?.long_name || "Unknown";
}

export function getMilitaryRatingLong(id: number | undefined) {
	return MILITARY_RATINGS.find((r) => r.id === id)?.long_name || "Unknown";
}

export function getPilotRatingShort(id: number | undefined) {
	return PILOT_RATINGS.find((r) => r.id === id)?.short_name || "Basic";
}

export function getMilitaryRatingShort(id: number | undefined) {
	return MILITARY_RATINGS.find((r) => r.id === id)?.short_name || "M0";
}

export function getControllerRatingShort(id: number | undefined) {
	return CONTROLLER_RATINGS.find((r) => r.id === id)?.short_name || "INAC";
}

export function getPilotRatingColor(id: number | undefined) {
	return PILOT_RATINGS.find((r) => r.id === id)?.color || "border-gray text-gray bg-gray/10";
}

export function getMilitaryRatingColor(id: number | undefined) {
	return MILITARY_RATINGS.find((r) => r.id === id)?.color || "border-gray text-gray bg-gray/10";
}

export function getControllerRatingColor(id: number | undefined) {
	return CONTROLLER_RATINGS.find((r) => r.id === id)?.color || "border-gray text-gray bg-gray/10";
}
