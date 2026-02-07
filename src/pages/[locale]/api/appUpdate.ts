import type { APIRoute } from "astro";
import api from "@/api";
import { isAndroidMobile } from '@/utils/device'

export const POST: APIRoute = async ({ request, locals }) => {
    try {
        const params = await request.json();

        const opt = {
            headers: {
                "x-forwarded-for": (locals as any)?.local_ip,
                "x-real-ip": (locals as any)?.local_ip,
            },
        };

        console.log(params, 'params')

        const r = await api.appUpdate({
            ...params
        }, opt);
        const data = (r as any)?.data ?? r;

        return new Response(JSON.stringify(data), {
            status: 200,
            headers: {
                "content-type": "application/json",
                "cache-control": "no-store",
            },
        });
    } catch (e: any) {
        return new Response(
            JSON.stringify({ ok: false, msg: "appUpdate_failed", err: e?.message || String(e) }),
            { status: 500, headers: { "content-type": "application/json" } },
        );
    }
};
