import crypto from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { NAVIGRAPH_AUTH_URL } from "@/app/auth/[...nextauth]/route";

export async function GET(req: NextRequest) {
	const token = await getToken({ req });
	if (!token?.vatsim?.cid) {
		return NextResponse.redirect(new URL("/", req.url));
	}

	const codeVerifier = crypto.randomBytes(32).toString("base64url");
	const codeChallenge = crypto.createHash("sha256").update(codeVerifier).digest("base64url");
	const state = crypto.randomBytes(16).toString("base64url");

	const origin = process.env.NODE_ENV === "production" ? "https://simradar21.com" : `${req.nextUrl.protocol}//${req.nextUrl.host}`;
	const redirectUri = `${origin}/auth/callback/navigraph`;

	const authUrl = new URL(`${NAVIGRAPH_AUTH_URL}/connect/authorize`);
	authUrl.searchParams.set("client_id", process.env.NAVIGRAPH_CLIENT_ID ?? "");
	authUrl.searchParams.set("response_type", "code");
	authUrl.searchParams.set("scope", "openid fmsdata offline_access");
	authUrl.searchParams.set("redirect_uri", redirectUri);
	authUrl.searchParams.set("code_challenge", codeChallenge);
	authUrl.searchParams.set("code_challenge_method", "S256");
	authUrl.searchParams.set("state", state);

	const response = NextResponse.redirect(authUrl.toString());
	response.cookies.set("ng_pkce_verifier", codeVerifier, {
		httpOnly: true,
		sameSite: "lax",
		path: "/",
		maxAge: 600,
	});
	response.cookies.set("ng_state", state, {
		httpOnly: true,
		sameSite: "lax",
		path: "/",
		maxAge: 600,
	});

	return response;
}
