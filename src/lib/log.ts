import { LOG_BASE_DIR, LOG_LEVEL, LOG_TO_STDOUT } from "astro:env/server";
import fs from "node:fs";
import path from "node:path";
import pino, { destination, type StreamEntry } from "pino";
import FileStreamRotator from "file-stream-rotator";

function isTrue(v?: string) {
  return String(v ?? "").trim().toLowerCase() === "true";
}

const PROJECT_ROOT = process.cwd();

const POD = process.env.POD_NAME || `local-${process.pid}`;

function ensureWritableDir(dir: string) {
  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.accessSync(dir, fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}
const LOG_BASE = path.join(PROJECT_ROOT, "logs");

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

export const logger = pino(
  { level: String(LOG_LEVEL || "info").toLowerCase(), base: { pod: POD } },
  pino.multistream(streams)
);
