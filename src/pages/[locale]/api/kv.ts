import type { APIRoute } from "astro";
import api from "@/api";

function pickValue(payload: any): string {
  if (!payload) return "";

  // axios: { data: ... }
  const p = payload?.data ?? payload;

  // 常见：{ value }
  if (typeof p?.value === "string") return p.value;

  // 常见：{ data: { value } }
  if (typeof p?.data?.value === "string") return p.data.value;

  // 常见：{ result: { value } }
  if (typeof p?.result?.value === "string") return p.result.value;

  // 数组：[{ value }]
  if (Array.isArray(p) && typeof p?.[0]?.value === "string") return p[0].value;

  // 更深一层：{ data: { data: { value } } }
  if (typeof p?.data?.data?.value === "string") return p.data.data.value;

  return "";
}

export const GET: APIRoute = async ({ url, locals }) => {
  const key = url.searchParams.get("key") || "";
  if (!key) {
    return new Response(JSON.stringify({ value: "" }), {
      status: 400,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }

  const ip = (locals as any).clientIP || (locals as any).local_ip || "";

  try {
    const r = await api.getKvConfig(
      { k: key },
      {
        headers: {
          "x-forwarded-for": ip,
          "x-real-ip": ip,
        },
      },
    );

    const value = pickValue(r);
    // 临时调试：如果还是空，打开看看真实返回
    // console.log("[kv-debug]", key, JSON.stringify(r?.data ?? r, null, 2));

    return new Response(JSON.stringify({ value }), {
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  } catch (e: any) {
    // console.log("[kv-error]", key, e?.message || e);
    return new Response(JSON.stringify({ value: "" }), {
      status: 200,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }
};
