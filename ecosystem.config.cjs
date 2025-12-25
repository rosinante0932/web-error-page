module.exports = {
  apps: [
    {
      name: "astro-app",
      cwd: "./",
      script: "./dist/server/entry.mjs",
      interpreter: "node",
      instances: 'max',
      env: {
        NODE_ENV: "production",
        APP_ENV: "prod",
      },
      // 日志走 docker logs
      out_file: "/dev/stdout",
      error_file: "/dev/stderr",
      merge_logs: true,
      time: true,
    },
  ],
}