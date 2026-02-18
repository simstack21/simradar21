import type { FastifyPluginAsync } from "fastify";
import { deleteUser, ensureUser, patchUser } from "../services/db.js";

const userRoutes: FastifyPluginAsync = async (app) => {
	app.get("/", { preHandler: app.authenticate }, async (request) => {
		const cid = request.user?.cid;
		const user = await ensureUser(cid);
		return { id: user.id };
	});

	app.delete("/", { preHandler: app.authenticate }, async (request) => {
		const cid = request.user?.cid;
		const user = await deleteUser(cid);
		return { id: user.id };
	});

	app.patch("/", { preHandler: app.authenticate }, async (request) => {
		const cid = request.user?.cid;
		const data = request.body as Partial<{ settings: any; filters: any; bookmarks: any }>;

		const user = await patchUser(cid, data);
		if (!user) {
			throw app.httpErrors.notFound({ error: "User not found" });
		}
		return { settings: user.settings };
	});

	app.get("/data", { preHandler: app.authenticate }, async (request) => {
		const cid = request.user?.cid;
		const user = await ensureUser(cid);
		return { settings: user.settings, filters: user.filters, bookmarks: user.bookmarks };
	});

	app.get("/navigraph", { preHandler: app.authenticate }, async (request) => {
		const cid = request.user?.cid;
		const user = await ensureUser(cid);
		return { hasNavigraph: user.hasNavigraph };
	});

	app.patch("/navigraph", { preHandler: app.authenticate }, async (request) => {
		const cid = request.user?.cid;
		const { accessToken, refreshToken, expiresAt } = request.body as {
			accessToken: string;
			refreshToken: string;
			expiresAt: number;
		};

		const user = await patchUser(cid, {
			navigraphToken: { accessToken, refreshToken, expiresAt },
			hasNavigraph: true,
		});

		return { hasNavigraph: user.hasNavigraph };
	});

	app.get("/navdata", { preHandler: app.authenticate }, async (request) => {
		const cid = request.user?.cid;
		const user = await ensureUser(cid);

		let fmsData: any;
		if (user.hasNavigraph && user.navigraphToken) {
			fmsData = null; // Placeholder for actual Navigraph FMS data retrieval logic
		} else {
			fmsData = null; // User does not have Navigraph linked
		}

		return { fmsData };
	});
};

export default userRoutes;
