import fp from "fastify-plugin";

const DAY_MS = 24 * 60 * 60 * 1000;
const BOOT_DELAY_MS = 5_000;

/**
 * Auto-expiry job: marks ACTIVE passes whose expiry_time has passed as EXPIRED.
 * Runs shortly after boot and then daily. Best-effort — failures are logged.
 */
export default fp(
  async (app) => {
    const sweep = async () => {
      try {
        const result = await app.prisma.userPass.updateMany({
          where: { status: "ACTIVE", expiryTime: { lt: new Date() } },
          data: { status: "EXPIRED" },
        });
        if (result.count > 0) {
          app.log.info({ expired: result.count }, "pass auto-expiry: marked passes expired");
        }
      } catch (error) {
        app.log.error(error, "pass auto-expiry sweep failed");
      }
    };

    const bootTimer = setTimeout(sweep, BOOT_DELAY_MS);
    const dailyTimer = setInterval(sweep, DAY_MS);
    // Don't keep the event loop alive solely for these timers.
    bootTimer.unref?.();
    dailyTimer.unref?.();

    app.addHook("onClose", async () => {
      clearTimeout(bootTimer);
      clearInterval(dailyTimer);
    });
  },
  { name: "pass-expiry", dependencies: ["prisma"] },
);
