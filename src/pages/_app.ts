let isGcTaskStarted = false;

export default () => {
  if (!isGcTaskStarted && import.meta.env.SSR) {
    isGcTaskStarted = true;

    // 使用 cron 表达式，例如每 30 分钟执行一次：'*/30 * * * *'
    import('node-cron').then((cron) => {
      cron.default.schedule('*/30 * * * *', () => {
        if (global.gc) {
          global.gc();
        }
      });
    });

    console.log('[Runtime] GC Cron Task Scheduled');
  }
}