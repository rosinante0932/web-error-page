import type { APIRoute } from "astro";
import { franchiseCountries } from "@/data/franchise";

export const GET: APIRoute = ({ url }) => {
  const q = (url.searchParams.get("q") || "").trim();
  const countryId = (url.searchParams.get("countryId") || "").trim();

  const sorted = [...franchiseCountries].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));

  const picked =
    sorted.find(c => c.id === countryId) ||
    sorted[0] ||
    null;

  const filterFn = (s: any) =>
    !q || s.nameZh?.includes(q) || s.cityZh?.includes(q) || s.addressZh?.includes(q);

  // 兼容：给旧前端继续用 list（默认“当前国家”的列表）
  const list = (picked?.franchises || []).filter(filterFn);

  // 新前端：国家下拉+各自的门店（也跟着 q 过滤）
  const countries = sorted.map(c => ({
    ...c,
    franchises: (c.franchises || []).filter(filterFn),
  }));

  return new Response(JSON.stringify({ countries, list, pickedCountryId: picked?.id || "" }), {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
};
