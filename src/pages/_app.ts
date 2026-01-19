let isGcTaskStarted = false;

export default () => {
  if (!isGcTaskStarted && import.meta.env.SSR) {
    isGcTaskStarted = true;

    // 使用 cron 表达式，例如每 30 分钟执行一次：'*/30 * * * *'
    import('node-cron').then((cron) => {
      cron.default.schedule('*/30 * * * *', async () => {
        const { logger } = await import("@/lib/log");
        try {
          global.gc();
          logger.debug({ pid: process.pid }, "[GC] manual gc triggered");
        } catch (e) {
          logger.warn({ err: e }, "[GC] manual gc failed");
        }

      });
    }).catch(async (e) => {
      const { logger } = await import("@/lib/log");
      logger.error({ e }, "[GC] failed to load node-cron");
    });

    console.log('[Runtime] GC Cron Task Scheduled');
  }
}