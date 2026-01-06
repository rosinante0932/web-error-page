module.exports = {
  apps: [
    {
      name: "web-error-page-app",
      cwd: "./",
      script: "./dist/server/entry.mjs",
      interpreter: "node",
      instances: 'max',
      max_memory_restart: '500M',
      env: {
        NODE_ENV: "production",
        APP_ENV: "prod",
      },
      out_file: "/dev/stdout",
      error_file: "/dev/stderr",
      merge_logs: true,
      time: true,
    },
  ],
}