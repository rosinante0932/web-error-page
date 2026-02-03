<template>
    <!-- 外层：桌面固定 600，移动端全屏 -->
    <div class="h-[100vh] md:h-[600px] md:min-h-[600px] bg-[#EEF3FF]">
        <!-- 桌面：左右两栏 -->
        <div class="hidden md:grid md:grid-cols-[320px_1fr] md:h-full">
            <!-- 左侧面板（桌面） -->
            <aside class="bg-white h-full border-r border-gray-200 flex flex-col">
                <div class="flex items-center gap-2 p-3 border-b border-gray-200">
                    <input v-model="keyword" @input="load" placeholder="搜索中文店铺"
                        class="flex-1 w-full px-3 py-2 rounded-xl border border-gray-200 outline-none focus:border-gray-400" />
                    <button class="px-3 py-2 rounded-xl border border-gray-200 bg-white active:scale-[0.98]"
                        @click="panelOpen = !panelOpen">
                        {{ panelOpen ? "收起" : "列表" }}
                    </button>
                </div>

                <div class="p-2 overflow-auto" :class="panelOpen ? 'block' : 'hidden'">
                    <div v-for="s in stores" :key="s.id"
                        class="p-3 rounded-xl cursor-pointer hover:bg-gray-50 active:bg-gray-100" @click="focus(s)">
                        <div class="font-700 text-[14px] leading-[1.2]">{{ s.nameZh }}</div>
                        <div class="mt-1 text-[12px] text-gray-500 leading-[1.35]">
                            {{ s.cityZh }} · {{ s.addressZh }}
                        </div>
                    </div>

                    <div v-if="!stores.length" class="p-3 text-[12px] text-gray-400">暂无结果</div>
                </div>
            </aside>

            <!-- 地图（桌面） -->
            <div ref="mapElDesktop" class="h-full" />
        </div>

        <!-- 移动端：顶部搜索+列表（红框区域） + 下方地图 -->
        <div class="md:hidden h-full flex flex-col relative z-1">
            <!-- 顶部区域（红框） -->
            <div class="px-3 pt-3">
                <div class="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
                    <!-- 搜索 + 按钮 -->
                    <div class="flex items-center gap-2 p-3 border-b border-gray-200">
                        <input v-model="keyword" @input="load" placeholder="搜索中文店铺"
                            class="flex-1 w-full px-3 py-2 rounded-xl border border-gray-200 outline-none focus:border-gray-400" />
                        <button class="px-3 py-2 rounded-xl border border-gray-200 bg-white active:scale-[0.98]"
                            @click="panelOpen = !panelOpen">
                            {{ panelOpen ? "收起" : "列表" }}
                        </button>
                    </div>

                    <!-- 列表（可收起，可滚动） -->
                    <div class="p-2 overflow-auto" :class="panelOpen ? 'max-h-[42vh]' : 'hidden'">
                        <div v-for="s in stores" :key="s.id"
                            class="p-3 rounded-xl cursor-pointer hover:bg-gray-50 active:bg-gray-100" @click="focus(s)">
                            <div class="font-800 text-[16px] leading-[1.2]">{{ s.nameZh }}</div>
                            <div class="mt-1 text-[12px] text-gray-500 leading-[1.35]">
                                {{ s.cityZh }} · {{ s.addressZh }}
                            </div>
                        </div>

                        <div v-if="!stores.length" class="p-3 text-[12px] text-gray-400">暂无结果</div>
                    </div>
                </div>
            </div>

            <!-- 地图：占剩余高度 -->
            <div class="flex-1 p-3 pt-3">
                <div ref="mapElMobile" class="h-full rounded-2xl overflow-hidden border border-gray-200" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch, nextTick } from "vue";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type StoreImage = {
    type: string;
    url: string;
    title?: string;
    order?: number;
};

type Store = {
    id: string;
    nameZh: string;
    lat: number;
    lng: number;
    cityZh: string;
    addressZh: string;

    images?: StoreImage[];
    rating?: number;
    reviews?: number;
    categoryZh?: string;
    priceTextZh?: string;
    openTimeHintZh?: string;
    statusZh?: string;
};

const mapElDesktop = ref<HTMLDivElement | null>(null);
const mapElMobile = ref<HTMLDivElement | null>(null);

const map = ref<L.Map | null>(null) as any;
const markers = new Map<string, L.Marker>();

const stores = ref<Store[]>([]);
const keyword = ref("");
const panelOpen = ref(true);

function isMobile() {
    return window.matchMedia?.("(max-width: 768px)")?.matches ?? false;
}

async function load() {
    const u = new URL("/api/franchise.json", window.location.origin);
    u.searchParams.set("q", keyword.value || "");

    const r = await fetch(u.toString());
    if (!r.ok) {
        const t = await r.text();
        console.error("[franchise api failed]", r.status, r.url, t.slice(0, 200));
        stores.value = [];
        renderMarkers();
        return;
    }

    const j = await r.json();
    stores.value = (j.list ?? []) as Store[];
    renderMarkers();
}

function esc(v: any) {
    const s = String(v ?? "");
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * @func buildPopupHtml
 * @desc 移动端弹窗适配策略：
 * - 宽度用 100%（由 popup-content 控制）
 * - 图片变矮
 * - 地址截断
 * - meta/status 手机隐藏
 */
function buildPopupHtml(s: Store) {
    const first = Array.isArray(s.images) && s.images.length > 0 ? String(s.images[0].url || "") : "";

    const metaLine = [
        typeof s.rating === "number" ? `⭐ ${s.rating.toFixed(1)}` : "",
        typeof s.reviews === "number" ? `(${s.reviews})` : "",
        s.categoryZh ? esc(s.categoryZh) : "",
        s.priceTextZh ? esc(s.priceTextZh) : "",
    ]
        .filter(Boolean)
        .join(" ");

    const statusLine = [
        s.statusZh ? `<span class="poi-status">${esc(s.statusZh)}</span>` : "",
        s.openTimeHintZh ? `<span class="poi-openhint">${esc(s.openTimeHintZh)}</span>` : "",
    ]
        .filter(Boolean)
        .join(" · ");

    return `
  <div class="poi-card">
    <div class="poi-media">
      ${first
            ? `<img class="poi-img" src="${esc(first)}" alt="${esc(s.nameZh)}" loading="lazy" />`
            : `<div class="poi-img-fallback">暂无宣传图</div>`
        }
    </div>

    <div class="poi-body">
      <div class="poi-title">${esc(s.nameZh)}</div>
      ${metaLine ? `<div class="poi-meta">${metaLine}</div>` : ""}
      ${statusLine ? `<div class="poi-statusline">${statusLine}</div>` : ""}
      <div class="poi-addr">${esc(s.cityZh)} · ${esc(s.addressZh)}</div>
    </div>
  </div>
  `;
}

function parseGoogleMapsLatLng(url: string) {
    // ✅ 1) 最准确：!3dLAT!4dLNG（POI 坐标）
    const m1 = url.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
    if (m1) {
        return { lat: Number(m1[1]), lng: Number(m1[2]), source: "3d4d" as const };
    }

    // ⚠️ 2) 退而求其次：@LAT,LNG（常是视野中心，不一定是 POI）
    const m2 = url.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
    if (m2) {
        return { lat: Number(m2[1]), lng: Number(m2[2]), source: "at" as const };
    }

    return null;
}


/**
 * @func isDesktopHover
 * @desc 桌面聚焦
 */
function isDesktopHover() {
    return window.matchMedia?.("(hover: hover) and (pointer: fine)")?.matches ?? false;
}

/**
 * @func renderMarkers
 * @desc 渲染标记
 */
function renderMarkers() {
    markers.forEach((m) => m.remove());
    markers.clear();
    if (!map.value) return;

    console.log(map.value.setView, 'mapmap===map')

    const hoverable = isDesktopHover();
    const mobile = isMobile();

    for (const s of stores.value) {
        const m = L.marker([s.lat, s.lng]).addTo(map.value);

        // 永久显示名字（直接显示在地图上，不是 hover）
        m.bindTooltip(s.nameZh, {
            permanent: true,
            direction: "bottom",   // 放到下面
            offset: [0, 10],       // 往下挪，避开 marker 尖
            opacity: 1,
            interactive: false,
            className: "poi-label",
        });

        m.bindPopup(buildPopupHtml(s), {
            maxWidth: mobile ? 320 : 420,
            minWidth: mobile ? 220 : 260,
            closeButton: true,
            autoPan: true,
            autoPanPaddingTopLeft: mobile ? [12, 170] : [12, 12],
            autoPanPaddingBottomRight: mobile ? [12, 180] : [12, 160],
            className: "poi-popup",
            offset: mobile ? [0, 18] : [0, 10],
        });

        // 你原来的 hover 打开 popup 逻辑：只影响 popup，不影响名字显示
        if (hoverable) {
            m.on("mouseover", () => m.openPopup());
            m.on("mouseout", () => m.closePopup());
        }

        markers.set(s.id, m);
    }
}


/**
 * @func focus
 * @desc 焦点
 */
function focus(s: Store) {
    map.value?.setView([s.lat, s.lng], 16);
    markers.get(s.id)?.openPopup();

    // 手机上点列表后自动收起（让地图视野更大）
    if (isMobile()) panelOpen.value = false;
}

/**
 * @func destroyMap
 * @desc 销毁
 */
function destroyMap() {
    if (!map.value) return;
    markers.forEach((m) => m.remove());
    markers.clear();
    map.value.remove();
    map.value = null;
}

/**
 * @func initMap
 * @desc 初始化地图
 */
function initMap(container: HTMLDivElement) {
    // 同容器重复初始化的兜底
    destroyMap();

    // 如果容器上残留了 _leaflet_id，也清掉 （HMR/某些情况下 remove 之后还会残留）
    const anyEl = container as any;
    if (anyEl._leaflet_id) {
        try { delete anyEl._leaflet_id; } catch { }
        try { anyEl._leaflet_id = undefined; } catch { }
    }
    // 你项目里如果需要自定义 zoomControl 位置也行
    map.value = L.map(container, { zoomControl: true }).setView([13.736, 100.523], 12);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
    }).addTo(map.value);
}

async function initial() {
    const container = isMobile() ? mapElMobile.value : mapElDesktop.value;
    if (!container) return;

    initMap(container);
    await load();

    // 初次渲染后让 Leaflet 重新计算尺寸（避免隐藏/切换造成错位）
    await nextTick();
    map.value?.invalidateSize();
}

onMounted(() => {
    initial()
});

// 折叠/展开会改变可视区域，Leaflet 需要重算尺寸
watch(panelOpen, async () => {
    await nextTick();
    map.value?.invalidateSize();
});

// 横竖屏/窗口变化时也重算（移动端最常见的卡住/错位原因）
let resizeTimer: any = null;
function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        // map.value?.invalidateSize();
        initial();
    }, 120);
}

window.addEventListener("resize", onResize);

onBeforeUnmount(() => {
    window.removeEventListener("resize", onResize);
    markers.forEach((m) => m.remove());
    markers.clear();
    map.value?.remove();
    map.value = null;
});
</script>

<style>
/* popup 内容不在 Vue 组件 DOM 内，UnoCSS 不会扫到它 => 用少量全局 CSS */

/* 桌面默认：卡片宽一点 */
.poi-card {
    width: 340px;
    max-width: 340px;
    font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
}

.poi-media {
    border-radius: 12px;
    overflow: hidden;
    background: #f3f4f6;
}

.poi-img {
    width: 100%;
    height: 150px;
    object-fit: cover;
    display: block;
    transition: transform 0.18s ease;
}

.poi-card:hover .poi-img {
    transform: scale(1.02);
}

.poi-img-fallback {
    height: 150px;
    display: grid;
    place-items: center;
    color: #6b7280;
    font-size: 13px;
}

.poi-body {
    padding: 10px 2px 0 2px;
}

.poi-title {
    font-weight: 800;
    font-size: 18px;
    line-height: 1.2;
}

.poi-meta {
    margin-top: 6px;
    color: #444;
    font-size: 13px;
}

.poi-statusline {
    margin-top: 6px;
    font-size: 13px;
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

.poi-status {
    color: #e11d48;
    font-weight: 700;
}

.poi-openhint {
    color: #444;
}

.poi-addr {
    margin-top: 6px;
    color: #666;
    font-size: 13px;
    line-height: 1.35;
}

/* Leaflet popup wrapper */
.leaflet-popup-content-wrapper {
    border-radius: 16px;
}

.leaflet-popup-content {
    margin: 12px;
}

/* ===========================
   移动端弹窗瘦身适配
   =========================== */
@media (max-width: 768px) {

    /* 卡片不写死宽度，跟随 popup-content 宽度 */
    .poi-card {
        width: 100% !important;
        max-width: 100% !important;
    }

    /* 图片缩矮，避免占屏 */
    .poi-img,
    .poi-img-fallback {
        height: 92px !important;
    }

    /* 标题稍微小一点 */
    .poi-title {
        font-size: 16px !important;
        line-height: 1.25 !important;
    }

    /* meta/status 手机隐藏（最省空间） */
    .poi-meta,
    .poi-statusline {
        display: none !important;
    }

    /* 地址最多两行 */
    .poi-addr {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    /* popup 本体宽度限制一下（防止撑出屏幕） */
    .leaflet-popup-content {
        margin: 10px !important;
        max-width: calc(100vw - 40px);
    }
}

/* 地图上永久名字标签（Tooltip） */
.poi-label {
    background: transparent !important;
    border: 0 !important;
    box-shadow: none !important;
    padding: 0 !important;
}

/* 白色胶囊 */
.poi-label .leaflet-tooltip-content {
    display: inline-block;
    max-width: 180px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    font-size: 12px;
    font-weight: 800;
    color: #111;

    background: rgba(255, 255, 255, 0.92);
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 999px;
    padding: 4px 8px;
}

/* 去掉默认小尖角 */
.poi-label.leaflet-tooltip-top::before {
    display: none !important;
}

/* 移动端更紧凑 */
@media (max-width: 768px) {
    .poi-label .leaflet-tooltip-content {
        max-width: 140px;
        font-size: 11px;
        padding: 3px 7px;
    }
}

.poi-label {
    transform: translateY(2px);
}
</style>
