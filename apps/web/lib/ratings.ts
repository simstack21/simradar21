const PILOT_RATINGS = [
	{
		id: 0,
		short_name: "Basic",
		long_name: "Basic Member",
		color: "border-gray text-gray bg-gray/10",
	},
	{
		id: 1,
		short_name: "PPL",
		long_name: "Private Pilot License",
		color: "border-green text-green bg-green/10",
	},
	{
		id: 3,
		short_name: "IR",
		long_name: "Instrument Rating",
		color: "border-blue text-blue bg-blue/10",
	},
	{
		id: 7,
		short_name: "CMEL",
		long_name: "Commercial Multi-Engine License",
		color: "border-yellow text-yellow bg-yellow/10",
	},
	{
		id: 15,
		short_name: "ATPL",
		long_name: "Airline Transport Pilot License",
		color: "border-magenta text-magenta bg-magenta/10",
	},
	{
		id: 31,
		short_name: "FI",
		long_name: "Flight Instructor",
		color: "border-magenta text-magenta bg-magenta/10",
	},
	{
		id: 63,
		short_name: "FE",
		long_name: "Flight Examiner",
		color: "border-magenta text-magenta bg-magenta/10",
	},
];

const MILITARY_RATINGS = [
	{
		id: 0,
		short_name: "M0",
		long_name: "No Military Rating",
		color: "border-gray text-gray bg-gray/10",
	},
	{
		id: 1,
		short_name: "M1",
		long_name: "Military Pilot License",
		color: "border-green text-green bg-green/10",
	},
	{
		id: 3,
		short_name: "M2",
		long_name: "Military Instrument Rating",
		color: "border-blue text-blue bg-blue/10",
	},
	{
		id: 7,
		short_name: "M3",
		long_name: "Military Multi-Engine Rating",
		color: "border-yellow text-yellow bg-yellow/10",
	},
	{
		id: 15,
		short_name: "M4",
		long_name: "Military Mission Ready Pilot",
		color: "border-magenta text-magenta bg-magenta/10",
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
		color: "border-green text-green bg-green/10",
	},
	{
		id: 3,
		short_name: "S2",
		long_name: "Tower Controller",
		color: "border-blue text-blue bg-blue/10",
	},
	{
		id: 4,
		short_name: "S3",
		long_name: "Senior Student",
		color: "border-yellow text-yellow bg-yellow/10",
	},
	{
		id: 5,
		short_name: "C1",
		long_name: "Enroute Controller",
		color: "border-magenta text-magenta bg-magenta/10",
	},
	{
		id: 6,
		short_name: "C2",
		long_name: "Controller 2 (not in use)",
		color: "border-magenta text-magenta bg-magenta/10",
	},
	{
		id: 7,
		short_name: "C3",
		long_name: "Senior Controller",
		color: "border-magenta text-magenta bg-magenta/10",
	},
	{
		id: 8,
		short_name: "I1",
		long_name: "Instructor",
		color: "border-magenta text-magenta bg-magenta/10",
	},
	{
		id: 9,
		short_name: "I2",
		long_name: "Instructor 2 (not in use)",
		color: "border-magenta text-magenta bg-magenta/10",
	},
	{
		id: 10,
		short_name: "I3",
		long_name: "Senior Instructor",
		color: "border-magenta text-magenta bg-magenta/10",
	},
	{
		id: 11,
		short_name: "SUP",
		long_name: "Supervisor",
		color: "border-magenta text-magenta bg-magenta/10",
	},
	{
		id: 12,
		short_name: "ADM",
		long_name: "Administrator",
		color: "border-magenta text-magenta bg-magenta/10",
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
