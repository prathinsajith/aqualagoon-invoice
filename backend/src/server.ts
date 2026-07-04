import { buildApp } from "./app.js";
import { env } from "./config/env.js";

const app = await buildApp();

// Surface silent-but-risky fallbacks at boot so production misconfig is loud.
if (env.isProduction) {
  if (env.storageDriver === "local") {
    app.log.warn(
      "Uploads are on LOCAL disk in production — files are lost on every redeploy/restart on ephemeral hosts (e.g. Railway). Set AWS_S3_* for durable storage.",
    );
  }
  if (!env.mailEnabled) {
    app.log.warn(
      "Email is NOT configured in production — password-reset and notification emails will silently not send. Set SMTP_* or EMAIL_PROVIDER and EMAIL_DEV_FALLBACK=false.",
    );
  }
}

try {
  await app.listen({ port: env.PORT, host: env.HOST });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}

// Graceful shutdown: close the server (which disconnects Prisma via onClose).
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, async () => {
    app.log.info(`Received ${signal}, shutting down...`);
    await app.close();
    process.exit(0);
  });
}
