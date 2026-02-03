import type { APIRoute } from "astro";
import { franchises } from "@/data/franchise";

export const GET: APIRoute = ({ url }) => {
  const q = (url.searchParams.get("q") || "").trim();

  const list = franchises.filter(s =>
    !q || s.nameZh.includes(q) || s.cityZh.includes(q) || s.addressZh.includes(q)
  );

  return new Response(JSON.stringify({ list }), {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
};
