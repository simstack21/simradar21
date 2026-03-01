import { rdsGetSingle } from "@sr24/db/redis";
import type { FastifyPluginAsync } from "fastify";
import { ensureUser, getFlightsByCallsign, getFlightsByRegistration, getPilotReplay } from "../services/db.js";
import { bookingsStore } from "../stores/bookings.js";
import { getDataVersions } from "../stores/static.js";
import { getNavigraphPackage } from "../services/navigraph.js";

const dataRoutes: FastifyPluginAsync = async (app) => {
	app.get("/static/versions", async () => {
		return await getDataVersions();
	});

	app.get(
		"/flights/callsign/:callsign",
		{
			schema: {
				params: {
					type: "object",
					properties: { callsign: { type: "string", minLength: 3 } },
					required: ["callsign"],
				},
				querystring: {
					type: "object",
					properties: {
						limit: { type: "string", pattern: "^[0-9]+$" },
						page: { type: "string", pattern: "^[0-9]+$" },
					},
				},
			},
		},
		async (request) => {
			const { callsign } = request.params as { callsign: string };
			const { limit, page } = request.query as { limit?: string; page?: string };

			return await getFlightsByCallsign(callsign, limit, page);
		},
	);

	app.get(
		"/flights/registration/:registration",
		{
			schema: {
				params: {
					type: "object",
					properties: { registration: { type: "string", minLength: 3 } },
					required: ["registration"],
				},
				querystring: {
					type: "object",
					properties: {
						limit: { type: "string", pattern: "^[0-9]+$" },
						page: { type: "string", pattern: "^[0-9]+$" },
					},
				},
			},
		},
		async (request) => {
			const { registration } = request.params as { registration: string };
			const { limit, page } = request.query as { limit?: string; page?: string };

			return await getFlightsByRegistration(registration, limit, page);
		},
	);

	app.get(
		"/pilot/:id",
		{
			schema: {
				params: {
					type: "object",
					properties: { id: { type: "string", minLength: 16, maxLength: 16 } },
					required: ["id"],
				},
			},
		},
		async (request) => {
			const { id } = request.params as { id: string };
			const pilotReplay = await getPilotReplay(id);
			if (!pilotReplay) {
				throw app.httpErrors.notFound({ error: "Pilot not found" });
			}
			return pilotReplay;
		},
	);

	app.get(
		"/aircraft/:reg",
		{
			schema: {
				params: {
					type: "object",
					properties: { reg: { type: "string", minLength: 4, maxLength: 8 } },
					required: ["reg"],
				},
			},
		},
		async (request) => {
			const { reg } = request.params as { reg: string };
			const aircraft = await rdsGetSingle(`static_fleet:${reg.toUpperCase()}`);
			if (!aircraft) {
				throw app.httpErrors.notFound({ error: "Aircraft not found" });
			}
			return aircraft;
		},
	);

	app.get("/bookings", async () => {
		return bookingsStore.bookings;
	});

	app.get("/navigraph/packages", { preHandler: app.authenticate }, async (request) => {
		const cid = request.user?.cid;
		const user = await ensureUser(cid);

		const subs = (user.navigraphSubscription ?? []) as string[];
		const status = subs.includes("fmsdata") ? "current" : "outdated";

		return await getNavigraphPackage(status);
	});

	app.get("/navigraph/packages/public", async () => {
		return await getNavigraphPackage("outdated");
	});
};

export default dataRoutes;
