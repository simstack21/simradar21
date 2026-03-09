import fastifyCors from "@fastify/cors";
import fastifyHelmet from "@fastify/helmet";
import fastifyRateLimit from "@fastify/rate-limit";
import fastifySensible from "@fastify/sensible";
import fastifyPlugin from "fastify-plugin";
import { authPlugin } from "./auth.js";

export default fastifyPlugin(async (app) => {
	app.register(fastifyHelmet);
	app.register(fastifyCors);
	app.register(fastifyRateLimit, {
		keyGenerator: (req) => {
			const cfIp = req.headers["cf-connecting-ip"];
			return (Array.isArray(cfIp) ? cfIp[0] : cfIp) ?? req.ip;
		},
	});
	app.register(fastifySensible);
	app.register(authPlugin);
});
