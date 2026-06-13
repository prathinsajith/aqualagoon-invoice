import fp from "fastify-plugin";
import rateLimit from "@fastify/rate-limit";
import { env } from "../config/env.js";

/**
 * Registers `@fastify/rate-limit` globally disabled, so it only applies to
 * routes that opt in via `config.rateLimit` (notably login). This keeps general
 * API traffic unthrottled while protecting credential endpoints from brute force.
 */
export default fp(
  async (app) => {
    await app.register(rateLimit, {
      global: false,
      max: env.LOGIN_RATE_MAX,
      timeWindow: env.LOGIN_RATE_WINDOW,
    });
  },
  { name: "rate-limit" },
);
