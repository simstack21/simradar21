import { rdsGetSingle, rdsSetSingle } from "@sr24/db/redis";
import axios from "axios";

const RELEASE_URL = "https://api.github.com/repos/simstack21/simstack21-data/releases/latest";
const BASE_DATA_URL = "https://github.com/simstack21/simstack21-data/releases/download/";

const SCHEMA_VERSION = 1;

let version: string | null = null;
let release: string | null = null;

export async function updateAirlines(): Promise<void> {
	if (!version) {
		await initVersion();
	}
	if (!(await isNewRelease())) return;

	try {
		const airlinesJsonUrl = `${BASE_DATA_URL}${release}/airlines.json`;

		const response = await axios.get(airlinesJsonUrl, {
			responseType: "json",
		});

		await rdsSetSingle("static_airlines:all", response.data);
		await rdsSetSingle("static_airlines:version", `${version || "1.0.0"}-s${SCHEMA_VERSION}`);

		console.log(`✅ Airlines data updated to version ${version}`);
	} catch (error) {
		console.error(`Error checking for new airlines data: ${error}`);
	}
}

async function initVersion(): Promise<void> {
	if (!version) {
		const redisVersion = await rdsGetSingle("static_airlines:version");
		version = (redisVersion || "0.0.0").replace(/-s\d+$/, "");
	}
}

async function isNewRelease(): Promise<boolean> {
	try {
		const releaseResponse = await axios.get(RELEASE_URL);
		release = releaseResponse.data.tag_name;

		const versionsResponse = await axios.get(`${BASE_DATA_URL}${release}/versions.json`, {
			responseType: "json",
		});
		const latestVersion = versionsResponse.data.airlines;

		if (latestVersion !== version) {
			version = latestVersion;
			return true;
		}
	} catch (error) {
		console.error(`Error checking for updates: ${error}`);
	}

	return false;
}
