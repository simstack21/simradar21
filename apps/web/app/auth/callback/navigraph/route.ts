import { sign } from "jsonwebtoken";
import { type NextRequest, NextResponse } from "next/server";
import { encode, getToken } from "next-auth/jwt";
import { NAVIGRAPH_AUTH_URL } from "@/app/auth/[...nextauth]/route";

const API_URL = process.env.API_URL ?? "http://localhost:3001";
const JWT_SECRET = process.env.NEXTAUTH_SECRET ?? "";
const NEXTAUTH_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000/auth";

function getSessionCookieName() {
	return process.env.NODE_ENV === "production" ? "__Secure-next-auth.session-token" : "next-auth.session-token";
}

function clearPkceCookies(response: NextResponse) {
	response.cookies.delete("ng_pkce_verifier");
	response.cookies.delete("ng_state");
}

export async function GET(req: NextRequest) {
	const { searchParams } = req.nextUrl;
	const code = searchParams.get("code");
	const state = searchParams.get("state");
	const storedState = req.cookies.get("ng_state")?.value;
	const codeVerifier = req.cookies.get("ng_pkce_verifier")?.value;

	const fail = (reason: string) => {
		console.error("Navigraph callback failed:", reason);
		const res = NextResponse.redirect(new URL("/", req.url));
		clearPkceCookies(res);
		return res;
	};

	if (!code || !state || state !== storedState || !codeVerifier) {
		return fail("invalid state or missing code/verifier");
	}

	const existingToken = await getToken({ req });
	if (!existingToken?.vatsim?.cid) {
		return fail("no VATSIM session");
	}

	// Exchange authorization code for tokens
	const tokenRes = await fetch(`${NAVIGRAPH_AUTH_URL}/connect/token`, {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({
			grant_type: "authorization_code",
			code,
			redirect_uri: `${NEXTAUTH_URL}/callback/navigraph`,
			client_id: process.env.NAVIGRAPH_CLIENT_ID ?? "",
			client_secret: process.env.NAVIGRAPH_CLIENT_SECRET ?? "",
			code_verifier: codeVerifier,
		}),
	});

	if (!tokenRes.ok) {
		return fail(`token exchange failed: ${await tokenRes.text()}`);
	}

	const tokens = (await tokenRes.json()) as {
		access_token: string;
		refresh_token: string;
		expires_in: number;
	};

	const navigraphData = {
		accessToken: tokens.access_token,
		refreshToken: tokens.refresh_token,
		expiresAt: Date.now() + tokens.expires_in * 1000,
	};

	// Persist to backend DB
	const jwtToken = sign({ vatsim: existingToken.vatsim }, JWT_SECRET, { expiresIn: "5m" });
	try {
		const saveRes = await fetch(`${API_URL}/user/navigraph`, {
			method: "PATCH",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${jwtToken}`,
			},
			body: JSON.stringify(navigraphData),
		});
		if (!saveRes.ok) {
			console.error("Failed to save Navigraph connection:", await saveRes.text());
		}
	} catch (err) {
		console.error("Failed to save Navigraph connection:", err);
	}

	const newToken = {
		...existingToken,
		navigraph: navigraphData,
		hasNavigraph: true,
	};

	const encodedToken = await encode({
		secret: JWT_SECRET,
		token: newToken,
	});

	const response = NextResponse.redirect(new URL("/", req.url));
	response.cookies.set(getSessionCookieName(), encodedToken, {
		httpOnly: true,
		sameSite: "lax",
		path: "/",
	});
	clearPkceCookies(response);

	return response;
}
