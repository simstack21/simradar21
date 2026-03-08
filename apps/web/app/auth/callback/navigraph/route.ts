import { sign } from "jsonwebtoken";
import { type NextRequest, NextResponse } from "next/server";
import { encode, getToken } from "next-auth/jwt";
import { NAVIGRAPH_AUTH_URL } from "@/app/auth/[...nextauth]/route";

const API_URL = process.env.API_URL ?? "http://localhost:3001";
const JWT_SECRET = process.env.NEXTAUTH_SECRET ?? "";
const NEXTAUTH_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000/auth";
const BASE_URL = new URL(NEXTAUTH_URL).origin;

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
		const res = NextResponse.redirect(new URL("/", BASE_URL));
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

	// Send tokens to backend — the backend verifies the access token against
	// Navigraph's public JWKS before storing, and extracts the subscription claim.
	const jwtToken = sign({ vatsim: existingToken.vatsim }, JWT_SECRET, { expiresIn: "5m" });
	try {
		const saveRes = await fetch(`${API_URL}/user/navigraph`, {
			method: "PATCH",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${jwtToken}`,
			},
			body: JSON.stringify({
				accessToken: tokens.access_token,
				refreshToken: tokens.refresh_token,
				expiresAt: Date.now() + tokens.expires_in * 1000,
			}),
		});
		if (!saveRes.ok) {
			return fail(`backend rejected Navigraph token: ${await saveRes.text()}`);
		}
	} catch (err) {
		return fail(`failed to save Navigraph connection: ${err}`);
	}

	const newToken = {
		...existingToken,
		hasNavigraph: true,
	};

	const encodedToken = await encode({
		secret: JWT_SECRET,
		token: newToken,
	});

	const response = NextResponse.redirect(new URL("/", BASE_URL));
	response.cookies.set(getSessionCookieName(), encodedToken, {
		httpOnly: true,
		sameSite: "lax",
		path: "/",
		secure: process.env.NODE_ENV === "production",
	});
	clearPkceCookies(response);

	return response;
}
