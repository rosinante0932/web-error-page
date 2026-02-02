let isGcTaskStarted = false;

export default () => {
  if (!isGcTaskStarted && import.meta.env.SSR) {
    isGcTaskStarted = true;

    import('node-cron').then((cron) => {
      cron.default.schedule('0 */6 * * *', async () => {
        const { logger } = await import("@/lib/server-logger/index.server");
        try {
          (global as any).gc();
          logger.warn({ pid: process.pid }, "[GC] manual gc triggered");
        } catch (e) {
          logger.warn({ err: e }, "[GC] manual gc failed");
        }

      });
    }).catch(async (e) => {
      const { logger } = await import("@/lib/server-logger/index.server");
      logger.error({ e }, "[GC] failed to load node-cron");
    });

    console.log('[Runtime] GC Cron Task Scheduled');
  }
}