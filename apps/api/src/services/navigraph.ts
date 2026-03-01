import crypto from "node:crypto";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { rdsGetSingle } from "@sr24/db/redis";
import type { NavigraphPackage } from "@sr24/types/db";
import jwt from "jsonwebtoken";

const NAVIGRAPH_JWKS_URL = "https://identity.api.navigraph.com/.well-known/jwks";
const NAVIGRAPH_TOKEN_URL = "https://identity.api.navigraph.com/connect/token";
const NAVIGRAPH_ISSUER = "https://identity.api.navigraph.com";

export interface NavigraphTokenPayload {
	sub: string;
	subscriptions?: string[];
	exp: number;
}

interface JWK {
	kty: string;
	kid: string;
	use?: string;
	n?: string;
	e?: string;
	[key: string]: unknown;
}

interface JWKSResponse {
	keys: JWK[];
}

let jwksCache: { keys: JWK[]; cachedAt: number } | null = null;
const JWKS_CACHE_TTL = 60 * 60 * 1000;

async function getJWKS(): Promise<JWK[]> {
	if (jwksCache && Date.now() - jwksCache.cachedAt < JWKS_CACHE_TTL) return jwksCache.keys;

	const res = await fetch(NAVIGRAPH_JWKS_URL);
	if (!res.ok) throw new Error(`Failed to fetch JWKS: ${res.status}`);

	const data = (await res.json()) as JWKSResponse;
	jwksCache = { keys: data.keys, cachedAt: Date.now() };

	return data.keys;
}

function jwkToPem(jwk: JWK): crypto.KeyObject {
	const rsaJwk: crypto.JsonWebKeyInput["key"] = {
		kty: jwk.kty,
		n: jwk.n,
		e: jwk.e,
	};
	return crypto.createPublicKey({ key: rsaJwk, format: "jwk" });
}

function getTokenKid(token: string): string | undefined {
	const [headerB64] = token.split(".");

	try {
		const header = JSON.parse(Buffer.from(headerB64, "base64url").toString()) as { kid?: string };
		return header.kid;
	} catch {
		return undefined;
	}
}

export async function verifyNavigraphToken(accessToken: string): Promise<NavigraphTokenPayload> {
	const kid = getTokenKid(accessToken);
	const keys = await getJWKS();

	const jwk = kid ? keys.find((k) => k.kid === kid) : keys[0];
	if (!jwk) throw new Error("No matching JWKS key found");

	const publicKey = jwkToPem(jwk);

	const payload = jwt.verify(accessToken, publicKey, {
		issuer: NAVIGRAPH_ISSUER,
		algorithms: ["RS256"],
	}) as NavigraphTokenPayload;

	return payload;
}

export async function refreshNavigraphToken(refreshToken: string): Promise<{
	accessToken: string;
	refreshToken: string;
	expiresAt: number;
	subscriptions: string[];
}> {
	const response = await fetch(NAVIGRAPH_TOKEN_URL, {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({
			grant_type: "refresh_token",
			client_id: process.env.NAVIGRAPH_CLIENT_ID ?? "",
			client_secret: process.env.NAVIGRAPH_CLIENT_SECRET ?? "",
			refresh_token: refreshToken,
		}),
	});

	if (!response.ok) {
		throw new Error(`Token refresh failed: ${await response.text()}`);
	}

	const tokens = (await response.json()) as {
		access_token: string;
		refresh_token?: string;
		expires_in: number;
	};

	const payload = await verifyNavigraphToken(tokens.access_token);

	return {
		accessToken: tokens.access_token,
		refreshToken: tokens.refresh_token ?? refreshToken,
		expiresAt: Date.now() + tokens.expires_in * 1000,
		subscriptions: payload.subscriptions ?? [],
	};
}

const r2 = new S3Client({
	region: "auto",
	endpoint: `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
	credentials: {
		accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
		secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
	},
});
const r2Bucket = process.env.R2_BUCKET_NAME ?? "";

export async function getNavigraphPackage(status: "current" | "outdated") {
	const pkg = (await rdsGetSingle(`navigraph:package:${status}`)) as NavigraphPackage | null;
	if (!pkg) return null;

	return {
		...pkg,
		url: await getSignedUrl(r2, new GetObjectCommand({ Bucket: r2Bucket, Key: pkg.r2Key }), { expiresIn: 600 }),
	};
}
