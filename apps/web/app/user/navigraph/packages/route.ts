import { sign } from "jsonwebtoken";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const API_URL = process.env.API_URL || "http://localhost:3001";
const JWT_SECRET = process.env.NEXTAUTH_SECRET || "";

export async function GET(req: NextRequest) {
	const token = await getToken({ req });
	if (!token?.vatsim?.cid) {
		const res = await fetch(`${API_URL}/data/navigraph/packages/public`);
		const body = await res.text();

		return new Response(body, {
			status: res.status,
			headers: { "Content-Type": "application/json" },
		});
	}

	const jwt = sign({ vatsim: token.vatsim }, JWT_SECRET, { expiresIn: "30m" });

	const res = await fetch(`${API_URL}/data/navigraph/packages`, {
		headers: { Authorization: `Bearer ${jwt}` },
	});

	const body = await res.text();
	return new Response(body, {
		status: res.status,
		headers: { "Content-Type": "application/json" },
	});
}
