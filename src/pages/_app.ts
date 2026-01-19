import { logger } from "@/lib/log";

let isGcTaskStarted = false;

export default () => {
  if (!import.meta.env.SSR) return;

  if (isGcTaskStarted) {
    logger.debug("[GC] GC cron already started, skip");
    return;
  }

  isGcTaskStarted = true;

  import("node-cron")
    .then((cron) => {
      cron.default.schedule("*/30 * * * *", () => {
        if (typeof global.gc === "function") {
          try {
            global.gc();
            logger.debug({ pid: process.pid }, "[GC] manual gc triggered");
          } catch (e) {
            logger.warn({ err: e }, "[GC] manual gc failed");
          }
        } else {
          // 只有第一次提示即可，避免刷日志
          logger.warn(
            { pid: process.pid },
            "[GC] global.gc not available (Node not started with --expose-gc)"
          );
        }
      });

      logger.info(
        {
          pid: process.pid,
          schedule: "*/30 * * * *",
        },
        "[GC] GC cron task scheduled"
      );
    })
    .catch((err) => {
      logger.error(
        { err },
        "[GC] failed to load node-cron, GC task not scheduled"
      );
    });
};
