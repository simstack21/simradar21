import type { FastifyPluginAsync } from "fastify";
import { searchPilotsByAll, searchPilotsByRoutes, searchPilotsByUsers } from "../services/db.js";

const searchRoutes: FastifyPluginAsync = async (app) => {
	app.get(
		"/",
		{
			schema: {
				querystring: {
					type: "object",
					properties: { q: { type: "string", minLength: 3 } },
					required: ["q"],
				},
			},
		},
		async (request) => {
			const { q: query } = request.query as { q?: string };
			if (!query || query.length < 1) {
				throw app.httpErrors.badRequest({ error: "Query parameter 'q' is required" });
			}

			return searchPilotsByAll(query);
		},
	);

	app.get(
		"/users",
		{
			schema: {
				querystring: {
					type: "object",
					properties: { q: { type: "string", minLength: 3 } },
					required: ["q"],
				},
			},
		},
		async (request) => {
			const { q: query } = request.query as { q?: string };
			if (!query || query.length < 1) {
				throw app.httpErrors.badRequest({ error: "Query parameter 'q' is required" });
			}

			return searchPilotsByUsers(query);
		},
	);

	app.get(
		"/routes",
		{
			schema: {
				querystring: {
					type: "object",
					properties: { q: { type: "string", minLength: 3 } },
					required: ["q"],
				},
			},
		},
		async (request) => {
			const { q: query } = request.query as { q?: string };
			if (!query || query.length < 1) {
				throw app.httpErrors.badRequest({ error: "Query parameter 'q' is required" });
			}

			const icaos = query.split("-");
			if (icaos.length !== 2) {
				throw app.httpErrors.badRequest({ error: "Query parameter 'q' must be in the format DEP-ARR" });
			}

			return searchPilotsByRoutes(icaos[0], icaos[1]);
		},
	);
};

export default searchRoutes;
