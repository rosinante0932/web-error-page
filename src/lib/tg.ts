import { DOCKER_PROXY_IP, TG_BOT_TOKEN, TG_CHAT_ID } from "astro:env/server";
import type { DestinationStream } from "pino";
import crypto from "node:crypto";
import { fetch, ProxyAgent } from "undici";

const TG_TEXT_LIMIT = 4096;
const SAFE_PAYLOAD_LIMIT = 3200;

/** ---------------- 限流参数（可调） ---------------- */
// 全局：10 秒最多 5 条（超了直接丢）
const GLOBAL_WINDOW_MS = 10_000;
const GLOBAL_MAX_PER_WINDOW = 5;

// 同类错误：60 秒只发 1 次（其余直接丢，不补发）
const SIG_COOLDOWN_MS = 60_000;
/** --------------------------------------------------- */

let globalWinStart = 0;
let globalCount = 0;

// ✅ 只保留 lastSentAt，不需要 suppressed/timer
type SigState = { lastSentAt: number };
const sigMap = new Map<string, SigState>();

function chunkString(s: string, size: number) {
  const parts: string[] = [];
  for (let i = 0; i < s.length; i += size) parts.push(s.slice(i, i + size));
  return parts;
}

function now() {
  return Date.now();
}

function canSendGlobal() {
  const t = now();
  if (t - globalWinStart > GLOBAL_WINDOW_MS) {
    globalWinStart = t;
    globalCount = 0;
  }
  globalCount += 1;
  return globalCount <= GLOBAL_MAX_PER_WINDOW;
}

// 生成“同类错误签名”：稳定去重
function signatureOf(log: any) {
  const msg = String(log.msg ?? "");
  const url = String(log.url ?? "");
  const err = String(log.err ?? log.error ?? "");
  const stack = String(log.stack ?? log.err?.stack ?? log.error?.stack ?? "")
    .split("\n")
    .slice(0, 3)
    .join("\n");
  const raw = `${log.level}|${msg}|${url}|${err}|${stack}`;
  return crypto.createHash("sha1").update(raw).digest("hex");
}

// ❗ 强制使用 IPv4 代理
export const tgProxyAgent = new ProxyAgent({
  uri: DOCKER_PROXY_IP,
  connect: { family: 4 },
});

async function tgSend(text: string) {
  // 保险：绝对不超过 TG 限制
  if (text.length > TG_TEXT_LIMIT) {
    text = text.slice(0, TG_TEXT_LIMIT - 50) + "\n...(truncated)";
  }

  const res = await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    dispatcher: tgProxyAgent,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: TG_CHAT_ID,
      text,
      parse_mode: "Markdown",
      disable_web_page_preview: true,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`tg_send_failed status=${res.status} body=${body}`);
  }
}

export function createTelegramStream(): DestinationStream {
  return {
    write: async (chunk: any) => {
      try {
        const log = typeof chunk === "string" ? JSON.parse(chunk) : chunk;

        // warn / error / fatal
        if (log.level < 40) return;

        /** 1) 全局限流：避免 TG 爆炸 */
        if (!canSendGlobal()) return;

        /** 2) 同类去重冷却：冷却期内直接截断（不补发） */
        const sig = signatureOf(log);
        const st = sigMap.get(sig) || { lastSentAt: 0 };

        const t = now();
        if (st.lastSentAt > 0 && t - st.lastSentAt < SIG_COOLDOWN_MS) {
          return; // ✅ 直接丢
        }

        // 允许发送：更新冷却起点
        st.lastSentAt = t;
        sigMap.set(sig, st);

        /** 3) 正常发送：支持分片 */
        const header = [
          "🚨 *Server Log Alert*",
          `*Level:* ${log.level}`,
          `*Time:* ${new Date(log.time).toISOString()}`,
          `*Pod:* ${log.pod || "-"}`,
        ].join("\n");

        const jsonText = JSON.stringify(log, null, 2);
        const payloadParts = chunkString(jsonText, SAFE_PAYLOAD_LIMIT);

        for (let i = 0; i < payloadParts.length; i++) {
          const prefix =
            i === 0
              ? header + (payloadParts.length > 1 ? `\n\n📦 *Part 1/${payloadParts.length}*` : "")
              : `📦 *Part ${i + 1}/${payloadParts.length}*`;

          const msg = `${prefix}\n\n\`\`\`json\n${payloadParts[i]}\n\`\`\``;
          await tgSend(msg);
        }
      } catch (e) {
        console.error("[TG_LOG_FAILED]", e);
      }
    },
  };
}
