export default () => {
}

// if (import.meta.env.SSR) {
//   setInterval(() => {
//     // 如果启动脚本里带了 --expose-gc，这里可以手动触发
//     if (global.gc) {
//       console.log('[mem] 正在手动触发 GC...');
//       global.gc();
//     }
    
//     const m = process.memoryUsage();
//     console.log('[mem]', {
//       rss: Math.round(m.rss / 1024 / 1024) + 'MB',
//       heapUsed: Math.round(m.heapUsed / 1024 / 1024) + 'MB',
//       // ... 其他字段
//     });
//   }, 30_000).unref?.();
// }