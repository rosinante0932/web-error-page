import cron from 'node-cron';

let isGcTaskStarted = false;

export default () => {
  if (!isGcTaskStarted && import.meta.env.SSR) {
    isGcTaskStarted = true;

    // 使用 cron 表达式，例如每 30 分钟执行一次：'*/30 * * * *'
    cron.schedule('*/30 * * * *', () => {
      if (global.gc) {
        console.log('[Runtime] Running scheduled GC via Cron...', new Date().toLocaleString());
        global.gc();
      }
    });
    
    console.log('[Runtime] GC Cron Task Scheduled');
  }
}