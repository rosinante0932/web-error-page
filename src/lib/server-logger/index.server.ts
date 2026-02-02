import { LOG_LEVEL, LOG_TO_STDOUT } from "astro:env/server";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pino, { destination, type StreamEntry } from "pino";
import FileStreamRotator from "file-stream-rotator";
import { createTelegramStream } from "@/lib/tg";

function isTrue(v?: string) {
  return String(v ?? "").trim().toLowerCase() === "true";
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const APP_DIR = path.resolve(__dirname);
const APP_ROOT = process.env.APP_ROOT ? path.resolve(process.env.APP_ROOT) : APP_DIR;

const POD = process.env.POD_NAME || process.env.HOSTNAME || 'local';
const LOCAL_FALLBACK_BASE = path.join(APP_ROOT, 'logs');

function ensureWritableDir(dir: string) {
  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.accessSync(dir, fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

const wantBase = '/logs';
const LOG_BASE = ensureWritableDir(wantBase) ? wantBase : LOCAL_FALLBACK_BASE;
if (LOG_BASE !== wantBase) {
  console.log(`[LOG] cannot use "${wantBase}" -> fallback "${LOG_BASE}"`);
}

let LOG_DIR = path.join(LOG_BASE, POD);
fs.mkdirSync(LOG_DIR, { recursive: true });

const fileStream = FileStreamRotator.getStream({
  filename: path.join(LOG_DIR, "app-%DATE%.log"),
  frequency: "daily",
  date_format: "YYYY-MM-DD",
  size: "200M",
  max_logs: "14d",
  audit_file: path.join(LOG_DIR, `.audit.${process.pid}.json`),
  extension: ".log",
});

const streams: StreamEntry[] = [{ stream: fileStream }];
if (isTrue(LOG_TO_STDOUT)) streams.push({ stream: destination(1) });

// ✅ 这一行就是加入 TG（warn 以上）
streams.push({ level: "warn", stream: createTelegramStream() });
streams.push({ level: "error", stream: createTelegramStream() });

export const logger = pino(
  { level: String(LOG_LEVEL || "info").toLowerCase(), base: { pod: POD } },
  pino.multistream(streams)
);

export function withTrace(meta: {
  traceId: string;
  domain?: string;
  ip?: string;
  risk?: string;
}) {
  return logger.child({
    traceId: meta.traceId,
    domain: meta.domain,
    ip: meta.ip,
    risk: meta.risk,
  });
}
