#!/usr/bin/env bash
set -euo pipefail

APP_ENV="${APP_ENV:-${NODE_ENV:-test}}"
APP_ENV="$(echo "$APP_ENV" | tr '[:upper:]' '[:lower:]')"

MAX_OLD_MB="${MAX_OLD_MB:-}"

pick_old_mb() {
  local env="$1"
  case "$env" in
    prod|production)
      echo 6144
      ;;
    staging|pre|preprod|uat|rc)
      echo 1024
      ;;
    test|testing|dev|development|local)
      echo 1024
      ;;
    *)
      # 未识别环境：保守一点
      echo 1024
      ;;
  esac
}

if [[ -z "$MAX_OLD_MB" ]]; then
  MAX_OLD_MB="$(pick_old_mb "$APP_ENV")"
fi

ENTRY="${ENTRY:-./dist/server/entry.mjs}"

echo "[start] env=$APP_ENV max_old_space_size=${MAX_OLD_MB}MB entry=$ENTRY"
echo "[start] node=$(node -v) pid=$$"

exec node \
  --max-old-space-size="$MAX_OLD_MB" \
  --expose-gc \
  --abort-on-uncaught-exception \
  --trace-warnings \
  "$ENTRY"
