import type { PilotParsedRoute } from "@sr24/types/interface";
import type { FastifyPluginAsync } from "fastify";
import { deleteUser, ensureUser, patchUser } from "../services/db.js";
import { refreshNavigraphToken, verifyNavigraphToken } from "../services/navigraph.js";
import { mapStore } from "../stores/vatsim.js";

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

	app.patch("/pilot", { preHandler: app.authenticate }, async (request) => {
		const { modifiedRoute, id } = request.body as { modifiedRoute: PilotParsedRoute; id: string };

		mapStore.setPilotModifiedRoute(id, modifiedRoute);
		return { ok: true };
	});

	app.get("/navigraph", { preHandler: app.authenticate }, async (request) => {
		const cid = request.user?.cid;
		const user = await ensureUser(cid);
		return { hasNavigraph: user.hasNavigraph };
	});

	app.patch("/navigraph", { preHandler: app.authenticate }, async (request, reply) => {
		const cid = request.user?.cid;
		const { accessToken, refreshToken, expiresAt } = request.body as {
			accessToken: string;
			refreshToken: string;
			expiresAt: number;
		};

		let subscriptions: string[] = [];
		try {
			const payload = await verifyNavigraphToken(accessToken);
			subscriptions = payload.subscriptions ?? [];
		} catch (err) {
			request.log.error({ err }, "Navigraph token verification failed");
			return reply.badRequest("Invalid Navigraph access token");
		}

		const user = await patchUser(cid, {
			navigraphToken: { accessToken, refreshToken, expiresAt },
			hasNavigraph: true,
			navigraphSubscription: subscriptions,
		});

		return { hasNavigraph: user.hasNavigraph, subscriptions };
	});

	app.get("/navdata", { preHandler: app.authenticate }, async (request) => {
		const cid = request.user?.cid;
		const user = await ensureUser(cid);

		if (!user.hasNavigraph || !user.navigraphToken) {
			return { subscriptions: [] };
		}

		const token = user.navigraphToken as { accessToken: string; refreshToken: string; expiresAt: number };

		if (Date.now() < token.expiresAt) {
			try {
				const payload = await verifyNavigraphToken(token.accessToken);
				return { subscriptions: payload.subscriptions ?? [] };
			} catch {
				// Fall through
			}
		}

		try {
			const refreshed = await refreshNavigraphToken(token.refreshToken);
			await patchUser(cid, {
				navigraphToken: {
					accessToken: refreshed.accessToken,
					refreshToken: refreshed.refreshToken,
					expiresAt: refreshed.expiresAt,
				},
				navigraphSubscription: refreshed.subscriptions,
			});
			return { subscriptions: refreshed.subscriptions };
		} catch (err) {
			request.log.error({ err }, "Failed to refresh Navigraph token");
			return { subscriptions: [] };
		}
	});
};

export default userRoutes;
