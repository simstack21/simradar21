import { promisify } from "node:util";
import { gzip } from "node:zlib";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { rdsGetMultiple } from "@sr24/db/redis";

const gzipAsync = promisify(gzip);

const accountId = process.env.CF_ACCOUNT_ID || "";
const accessKeyId = process.env.R2_ACCESS_KEY_ID || "";
const secret = process.env.R2_SECRET_ACCESS_KEY || "";
const bucket = process.env.R2_BUCKET_NAME || "";

const r2 = new S3Client({
	region: "auto",
	endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
	credentials: { accessKeyId, secretAccessKey: secret },
});

export async function updateR2Storage(): Promise<void> {
	const versions: string[] = await rdsGetMultiple("", [
		"static_airports:version",
		"static_firs:version",
		"static_tracons:version",
		"static_airlines:version",
		"static_aircrafts:version",
	]);
	const manifest = {
		airportsVersion: versions[0],
		firsVersion: versions[1],
		traconsVersion: versions[2],
		airlinesVersion: versions[3],
		aircraftsVersion: versions[4],
	};

	await uploadManifestToR2(manifest);

	const datas = await rdsGetMultiple("", [
		"static_airports:all",
		"static_firs:all",
		"static_tracons:all",
		"static_airlines:all",
		"static_aircrafts:all",
	]);
	await uploadJsonToR2(`airports_${manifest.airportsVersion}.json`, datas[0]);
	await uploadJsonToR2(`firs_${manifest.firsVersion}.json`, datas[1]);
	await uploadJsonToR2(`tracons_${manifest.traconsVersion}.json`, datas[2]);
	await uploadJsonToR2(`airlines_${manifest.airlinesVersion}.json`, datas[3]);
	await uploadJsonToR2(`aircrafts_${manifest.aircraftsVersion}.json`, datas[4]);
	console.log("✅ R2 storage update completed!");
}

export async function uploadJsonToR2(key: string, data: unknown) {
	const compressed = await gzipAsync(JSON.stringify(data));
	return await r2.send(
		new PutObjectCommand({
			Bucket: bucket,
			Key: key,
			Body: compressed,
			ContentEncoding: "gzip",
			ContentType: "application/json",
		}),
	);
}

export async function uploadToR2(key: string, body: Buffer | Uint8Array | Blob | string, contentLength?: number) {
	return await r2.send(
		new PutObjectCommand({
			Bucket: bucket,
			Key: key,
			Body: body,
			ContentLength: contentLength,
		}),
	);
}

async function uploadManifestToR2(manifest: object) {
	const manifestJson = JSON.stringify(manifest);
	return await uploadToR2("manifest.json", manifestJson);
}
