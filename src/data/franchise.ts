export type FranchiseImage = {
  type: "cover" | "promo" | "environment" | "food";
  url: string;
  title?: string;
  order?: number;
};

export type Franchise = {
  /** 基础信息（你原来的） */
  id: string;
  nameZh: string;
  cityZh: string;
  addressZh: string;
  googleUrl: string;

  /** 扩展信息（可选，不影响旧代码） */
  category?: string;
  tags?: string[];
  rating?: number;
  priceText?: string;
  openTimeHint?: string;

  /** 宣传 / 展示图 */
  images?: FranchiseImage[];
};

export type FranchiseCountry = {
  id: string;     // 例如 "th" / "la" / "vn"
  name: string;   // 下拉显示：泰国/老挝/越南...
  sort: number;   // 排序
  franchises: Franchise[];
};

const thFranchises: Franchise[] = [
  {
    id: "cn-dongbei-dumpling-ratchada",
    nameZh: "东北老妈饺子馆（拉差达）",
    cityZh: "曼谷",
    googleUrl:
      "https://www.google.com/maps/place/%E4%B8%9C%E5%8C%97%E8%80%81%E5%A6%88%E9%A5%BA%E5%AD%90%E9%A6%86+%E0%B8%A3%E0%B9%89%E0%B8%B2%E0%B8%99%E0%B8%AD%E0%B8%B2%E0%B8%AB%E0%B8%B2%E0%B8%A3%E0%B8%9A%E0%B8%B1%E0%B8%A7%E0%B9%82%E0%B8%A0%E0%B8%8A%E0%B8%99%E0%B8%B2/@13.7784292,100.5712402,17z/data=!3m1!4b1!4m6!3m5!1s0x30e29e801d14ec8f:0xe1faab4eb014b63c!8m2!3d13.778424!4d100.5738151!16s%2Fg%2F11c1mkz34r?entry=ttu&g_ep=EgoyMDI2MDEyOC4wIKXMDSoASAFQAw%3D%3D",
    addressZh: "Ratchadaphisek Rd · Huai Khwang · Bangkok 10320",
    category: "中餐馆 · 饺子",
    rating: 3.3,
    priceText: "฿3,000+",
    openTimeHint: "营业至 04:00",
    images: [
      {
        type: "cover",
        url: "https://lh3.googleusercontent.com/p/AF1QipPFPvevm92x3dAijdo4qm1L_tZtzH6pHnjdp26a=w517-h240-k-no",
        title: "东北老妈饺子馆",
      },
    ],
  },
  {
    id: "food_321bbq_ratchada",
    nameZh: "321BBQ（拉差达）",
    cityZh: "曼谷",
    googleUrl:
      "https://www.google.com/maps/place/321BBQ%EF%BC%88Ratchada%EF%BC%89/@13.7827548,100.5692679,17z/data=!3m1!4b1!4m6!3m5!1s0x30e29f81854024df:0x615ecbc59921e90d!8m2!3d13.7827496!4d100.5741388!16s%2Fg%2F11r_6_28fs?entry=ttu&g_ep=EgoyMDI2MDEyOC4wIKXMDSoASAFQAw%3D%3D",
    addressZh: "260 Ratchadaphisek Rd, Huai Khwang, Bangkok 10310",
    category: "烧烤",
    tags: ["烧烤", "BBQ", "夜宵", "聚餐"],
    rating: 3.7,
    priceText: "฿2,000+",
    openTimeHint: "16:00 后营业",
    images: [
      {
        type: "cover",
        url: "https://lh3.googleusercontent.com/gps-cs-s/AHVAweo5HzIv8Lab-brdFl46liFtWHJY24XUbNjGoks_AhnzydxIDiJeeJQdgHgualiZFnuySMGZfYy0jgR3IibzqHth-rmUKkY4mHzwmC1CExAySfBBkJ6U4sLUC3MSCuK87v_npcI=w408-h244-k-no",
        title: "321BBQ 门店",
      },
      {
        type: "environment",
        url: "https://lh3.googleusercontent.com/gps-cs-s/AHVAweo5HzIv8Lab-brdFl46liFtWHJY24XUbNjGoks_AhnzydxIDiJeeJQdgHgualiZFnuySMGZfYy0jgR3IibzqHth-rmUKkY4mHzwmC1CExAySfBBkJ6U4sLUC3MSCuK87v_npcI=w408-h244-k-no",
      },
      {
        type: "food",
        url: "https://lh3.googleusercontent.com/gps-cs-s/AHVAweo5HzIv8Lab-brdFl46liFtWHJY24XUbNjGoks_AhnzydxIDiJeeJQdgHgualiZFnuySMGZfYy0jgR3IibzqHth-rmUKkY4mHzwmC1CExAySfBBkJ6U4sLUC3MSCuK87v_npcI=w408-h244-k-no",
      },
      {
        type: "promo",
        url: "https://lh3.googleusercontent.com/gps-cs-s/AHVAweo5HzIv8Lab-brdFl46liFtWHJY24XUbNjGoks_AhnzydxIDiJeeJQdgHgualiZFnuySMGZfYy0jgR3IibzqHth-rmUKkY4mHzwmC1CExAySfBBkJ6U4sLUC3MSCuK87v_npcI=w408-h244-k-no",
        title: "活动宣传",
      },
    ],
  },
  {
    id: "food-gaolaojiu-hotpot-ratchada",
    nameZh: "高老九火锅店",
    cityZh: "曼谷",
    googleUrl:
      "https://www.google.com/maps/place/%E0%B8%89%E0%B8%87%E0%B8%8A%E0%B8%B4%E0%B9%88%E0%B8%87%E0%B9%80%E0%B8%81%E0%B8%B2%E0%B9%80%E0%B8%81%E0%B9%89%E0%B8%B2/@13.7763742,100.5706064,17z/data=!3m1!4b1!4m6!3m5!1s0x30e29f179b46d811:0x925c86241548588!8m2!3d13.776369!4d100.5731813!16s%2Fg%2F11tnwl3520?entry=ttu&g_ep=EgoyMDI2MDEyOC4wIKXMDSoASAFQAw%3D%3D",
    addressZh: "167/17-20 Ratchadaphisek Rd, Din Daeng, Bangkok 10400",
    category: "火锅",
    tags: ["火锅", "中餐", "聚餐"],
    rating: 4.5,
    priceText: "฿2,000+",
    openTimeHint: "16:00 后营业",
    images: [
      {
        type: "cover",
        url: "https://lh3.googleusercontent.com/p/AF1QipN5DH-h9U40F_jPzs_Ui4g-k4nTy-ibWYVyAxUv=w426-h240-k-no",
        title: "高老九火锅店",
      },
    ],
  },
  {
    id: "food-xiaolongkan-hotpot-huaikhwang",
    nameZh: "小龙坎火锅（曼谷谷店）",
    cityZh: "曼谷",
    googleUrl:
      "https://www.google.com/maps/place/xiaolongkan%E5%B0%8F%E9%BE%99%E5%9D%8E%E6%9B%BC%E8%B0%B7%E5%BA%97/@13.7764593,100.5319815,13z/data=!4m10!1m2!2m1!1z5bCP6b6Z5Z2O!3m6!1s0x30e29f1d79d70fc7:0x379d2a7b25821e32!8m2!3d13.7450688!4d100.5845667!15sCgnlsI_pvpnlnY5aDCIK5bCP6b6ZIOWdjpIBEmhvdF9wb3RfcmVzdGF1cmFudOABAA!16s%2Fg%2F11l1dsfj2w?entry=ttu&g_ep=EgoyMDI2MDEyOC4wIKXMDSoASAFQAw%3D%3D",
    addressZh: "1 Soi Phetchaburi 47, Bang Kapi, Huai Khwang, Bangkok 10310",
    category: "火锅",
    tags: ["火锅", "川渝", "聚餐"],
    rating: 4.5,
    priceText: "฿1,000+",
    openTimeHint: "营业至 05:00",
    images: [
      {
        type: "cover",
        url: "https://lh3.googleusercontent.com/gps-cs-s/AHVAwer3ijX4i_lxeUbyjCmmjfOrXoiKPaqUXaSj02yMQiyJI1FXJmCfIf7TaXVzLW74BOGgOoy1ktnp08YB9Dqu7as4X4xLw3vkpRE7knvYn0X6tfIOcOZ-7W-AvoiwzN36ffC_BPgs=w408-h544-k-no",
        title: "小龙坎门店",
      },
    ],
  },
  {
    id: "mall-maya-chiangmai",
    nameZh: "玛雅购物中心",
    cityZh: "清迈",
    googleUrl:
      "https://www.google.com/maps/place/%E7%8E%9B%E9%9B%85%E8%B4%AD%E7%89%A9%E4%B8%AD%E5%BF%83/@18.8018836,98.9651546,17z/data=!3m1!4b1!4m6!3m5!1s0x30da3a61c9365a0b:0x248e54e7878f327e!8m2!3d18.8018785!4d98.9677295!16s%2Fg%2F1yprv63cp?entry=ttu&g_ep=EgoyMDI2MDEyOC4wIKXMDSoASAFQAw%3D%3D",
    addressZh: "55 Huay Kaew Rd, Suthep, Mueang Chiang Mai District, Chiang Mai 50200",
    category: "购物中心",
    tags: ["购物中心", "商场", "餐饮", "购物"],
    rating: 4.4,
    images: [
      {
        type: "cover",
        url: "https://lh3.googleusercontent.com/gps-cs-s/AHVAwepnXt34-GiQqpmc_7k-X5M9_6rqhmySbubs4-s3U3AfLsZPLbV1QTZ7YJlM_Xgb62inNoo_qdiS5IdQoCXUbmhIfDwsXmmCZdPduBamyKg6QrzE67FqdpWBczIFxP_Zu9nmTUGiYaAa5AvJ=w408-h265-k-no",
        title: "玛雅购物中心",
      },
    ],
  },
  {
    id: "food-lily-kitchen-pattaya",
    nameZh: "李家厨房 Lily's Kitchen",
    cityZh: "芭提雅",
    googleUrl:
      "https://www.google.com/maps/place/%E6%9D%8E%E5%AE%B6%E5%8E%A8%E6%88%BF+lily's+kitchen/@12.9423533,100.8851395,17z/data=!4m10!1m2!2m1!1z5p2O5a625Y6o5oi_!3m6!1s0x31029718ab4b841b:0x7124bc584bc53547!8m2!3d12.9423042!4d100.8881328!15sCgzmnY7lrrbljqjmiL9aECIO5p2OIOWutiDljqjmiL-SARJjaGluZXNlX3Jlc3RhdXJhbnTgAQA!16s%2Fg%2F11y2mm289m?entry=ttu&g_ep=EgoyMDI2MDEyOC4wIKXMDSoASAFQAw%3D%3D",
    addressZh: "78/97 Moo 9, Nongprue, Bang Lamung District, Chon Buri 20150",
    category: "中餐馆",
    tags: ["中餐", "川菜", "家常菜", "宵夜"],
    rating: 4.6,
    priceText: "฿200–400",
    openTimeHint: "营业至 02:00",
    images: [
      {
        type: "cover",
        url: "https://lh3.googleusercontent.com/p/AF1QipMe3Bvdp65GP-AyQDO5GvjAy6qoBDK9OvK9Wv_Y=w426-h240-k-no",
        title: "李家厨房 门店外观",
      },
    ],
  },
];

const laoFranchises: Franchise[] = [
  {
    id: "cn-dongbei-dumpling-ratchada",
    nameZh: "雅典饭店",
    cityZh: "永珍",
    tags: ["酒店"],
    googleUrl: "https://www.google.com/maps/place/%E9%9B%85%E5%85%B8%E9%A5%AD%E5%BA%97/@17.9764414,102.5795601,17z/data=!4m9!3m8!1s0x31246951795604c1:0x5cd84b7fc995f474!5m2!4m1!1i2!8m2!3d17.9775836!4d102.5800057!16s%2Fg%2F11v9gh73pg?entry=ttu&g_ep=EgoyMDI2MDIwMS4wIKXMDSoKLDEwMDc5MjA2N0gBUAM%3D",
    addressZh: "Ratchadaphisek Rd · Huai Khwang · Bangkok 10320",
    category: "酒店",
    rating: 3.3,
    priceText: "฿3,000+",
    openTimeHint: "营业至 04:00",
    images: [
      {
        type: "cover",
        url: "https://lh3.googleusercontent.com/p/AF1QipPCEHOJQYSieZulwVSm3WDFAOc1lrXTwZgYVkUP=w408-h272-k-no",
        title: "雅典饭店",
      },
    ],
  },
  {
    id: "food_321bbq_ratchada",
    nameZh: "万象三江大酒店",
    cityZh: "永珍",
    googleUrl:
      "https://www.google.com/maps/place/%E4%B8%87%E8%B1%A1%E4%B8%89%E6%B1%9F%E5%A4%A7%E9%85%92%E5%BA%97/@17.9725768,102.5788267,17z/data=!4m10!3m9!1s0x31246856935582bf:0x5fac898145c21f2c!5m3!1s2026-02-16!4m1!1i2!8m2!3d17.9725768!4d102.581407!16s%2Fg%2F12vsrb1y5?entry=ttu&g_ep=EgoyMDI2MDIwMS4wIKXMDSoKLDEwMDc5MjA2N0gBUAM%3D",
    addressZh: "260 Ratchadaphisek Rd, Huai Khwang, Bangkok 10310",
    category: "烧烤",
    tags: ["酒店"],
    rating: 3.7,
    priceText: "฿2,000+",
    openTimeHint: "16:00 后营业",
    images: [
      {
        type: "cover",
        url: "https://lh3.googleusercontent.com/gps-cs-s/AHVAweo5HzIv8Lab-brdFl46liFtWHJY24XUbNjGoks_AhnzydxIDiJeeJQdgHgualiZFnuySMGZfYy0jgR3IibzqHth-rmUKkY4mHzwmC1CExAySfBBkJ6U4sLUC3MSCuK87v_npcI=w408-h244-k-no",
        title: "321BBQ 门店",
      },
      {
        type: "environment",
        url: "https://lh3.googleusercontent.com/gps-cs-s/AHVAweo5HzIv8Lab-brdFl46liFtWHJY24XUbNjGoks_AhnzydxIDiJeeJQdgHgualiZFnuySMGZfYy0jgR3IibzqHth-rmUKkY4mHzwmC1CExAySfBBkJ6U4sLUC3MSCuK87v_npcI=w408-h244-k-no",
      },
      {
        type: "food",
        url: "https://lh3.googleusercontent.com/gps-cs-s/AHVAweo5HzIv8Lab-brdFl46liFtWHJY24XUbNjGoks_AhnzydxIDiJeeJQdgHgualiZFnuySMGZfYy0jgR3IibzqHth-rmUKkY4mHzwmC1CExAySfBBkJ6U4sLUC3MSCuK87v_npcI=w408-h244-k-no",
      },
      {
        type: "promo",
        url: "https://lh3.googleusercontent.com/gps-cs-s/AHVAweo5HzIv8Lab-brdFl46liFtWHJY24XUbNjGoks_AhnzydxIDiJeeJQdgHgualiZFnuySMGZfYy0jgR3IibzqHth-rmUKkY4mHzwmC1CExAySfBBkJ6U4sLUC3MSCuK87v_npcI=w408-h244-k-no",
        title: "活动宣传",
      },
    ],
  },
  {
    id: "food-gaolaojiu-hotpot-ratchada",
    nameZh: "渝味晓宇火锅(YuWeiXiaoYu HotPot)",
    cityZh: "永珍",
    googleUrl:
      "https://www.google.com/maps/place/%E6%B8%9D%E5%91%B3%E6%99%93%E5%AE%87%E7%81%AB%E9%94%85(YuWeiXiaoYu+HotPot)/@17.9628566,102.6161792,17z/data=!3m1!4b1!4m6!3m5!1s0x312467fc0563932d:0xe65fbbb507d3f0b0!8m2!3d17.9628566!4d102.6187595!16s%2Fg%2F11vj0xxfjl?entry=ttu&g_ep=EgoyMDI2MDIwMS4wIKXMDSoKLDEwMDc5MjA2N0gBUAM%3D",
    addressZh: "167/17-20 Ratchadaphisek Rd, Din Daeng, Bangkok 10400",
    category: "火锅",
    tags: ["火锅", "中餐", "聚餐"],
    rating: 4.5,
    priceText: "฿2,000+",
    openTimeHint: "16:00 后营业",
    images: [
      {
        type: "cover",
        url: "https://lh3.googleusercontent.com/p/AF1QipPGvNiSFtBYyFnOWvcmkRv7J7nrlcsM1e-0hU41=w408-h306-k-no",
        title: "渝味晓宇火锅",
      },
    ],
  },
  {
    id: "food-xiaolongkan-hotpot-huaikhwang",
    nameZh: "D-mart T2",
    cityZh: "永珍",
    googleUrl:
      "https://www.google.com/maps/place/D-mart+T2/@17.9764414,102.5795601,17z/data=!3m1!4b1!4m10!3m9!1s0x3124695919d4f501:0x8670648eb63910cb!5m3!1s2026-02-16!4m1!1i2!8m2!3d17.9764415!4d102.5844257!16s%2Fg%2F11v43f2wkr?entry=ttu&g_ep=EgoyMDI2MDIwMS4wIKXMDSoKLDEwMDc5MjA2N0gBUAM%3D",
    addressZh: "1 Soi Phetchaburi 47, Bang Kapi, Huai Khwang, Bangkok 10310",
    category: "超市",
    tags: ["超市"],
    rating: 4.5,
    priceText: "฿1,000+",
    openTimeHint: "营业至 05:00",
    images: [
      {
        type: "cover",
        url: "https://lh3.googleusercontent.com/gps-cs-s/AHVAwer3ijX4i_lxeUbyjCmmjfOrXoiKPaqUXaSj02yMQiyJI1FXJmCfIf7TaXVzLW74BOGgOoy1ktnp08YB9Dqu7as4X4xLw3vkpRE7knvYn0X6tfIOcOZ-7W-AvoiwzN36ffC_BPgs=w408-h544-k-no",
        title: "小龙坎门店",
      },
    ],
  },
];

const phpFranchises: Franchise[] = [
  {
    id: "cn-dongbei-dumpling-ratchada",
    nameZh: "Club ZZYZX",
    cityZh: "马尼拉大都会",
    tags: ["酒吧"],
    googleUrl: "https://www.google.com/maps/place/Club+ZZYZX/@14.5708028,120.981442,17z/data=!3m1!4b1!4m6!3m5!1s0x3397ca2a8bfd7097:0xca7489aafe1d683f!8m2!3d14.5708029!4d120.9863076!16s%2Fg%2F11cl_5kb68?entry=ttu&g_ep=EgoyMDI2MDIwMS4wIKXMDSoKLDEwMDc5MjA2N0gBUAM%3D",
    addressZh: "Ratchadaphisek Rd · Huai Khwang · Bangkok 10320",
    category: "酒店",
    rating: 3.3,
    priceText: "฿3,000+",
    openTimeHint: "营业至 04:00",
    images: [
      {
        type: "cover",
        url: "https://lh3.googleusercontent.com/gps-cs-s/AHVAwepW_pvBoapNjs_DlKSh3diaG0YqCatjcqlMFAfzkxYPIxE-buvYhrk-F1gJSQQt5Xb106v7zes8Lw1iJ3m9TiUAkUYWYlgUG4uX5ZD8jMx8V-UYF3zg-CY7LAreJQk1dTmqUlcsxW3GXwsd=w408-h541-k-no",
        title: "越南风味餐馆",
      },
    ],
  },
  {
    id: "food_321bbq_ratchada",
    nameZh: "SM",
    cityZh: "帕塞",
    googleUrl:
      "https://www.google.com/maps/place/SM+Mall+of+Asia/@14.5365708,120.9751065,17z/data=!3m1!4b1!4m6!3m5!1s0x3397cbfc84288ed7:0xe842057d2e701f9b!8m2!3d14.5365709!4d120.9799721!16zL20vMDluNnR5?entry=ttu&g_ep=EgoyMDI2MDIwMS4wIKXMDSoKLDEwMDc5MjA2N0gBUAM%3D",
    addressZh: "260 Ratchadaphisek Rd, Huai Khwang, Bangkok 10310",
    category: "购物中心",
    tags: ["购物中心"],
    rating: 3.7,
    priceText: "฿2,000+",
    openTimeHint: "16:00 后营业",
    images: [
      {
        type: "cover",
        url: "https://lh3.googleusercontent.com/gps-cs-s/AHVAweojhKPVNuIngTQX-DKQk2JSIzvZOP3WoWHpixREOvTIlK3sRpj6hzPumk91a7rTRmcLUVDa5OtjCAX_--P3jAGSMvlR-OAu44ctoq3YZaQRx_6UKy92-bxMGupzN7SxfLh7t_OIh7tcPNhB=w408-h249-k-no",
        title: "321BBQ 门店",
      },
      {
        type: "environment",
        url: "https://lh3.googleusercontent.com/gps-cs-s/AHVAweo5HzIv8Lab-brdFl46liFtWHJY24XUbNjGoks_AhnzydxIDiJeeJQdgHgualiZFnuySMGZfYy0jgR3IibzqHth-rmUKkY4mHzwmC1CExAySfBBkJ6U4sLUC3MSCuK87v_npcI=w408-h244-k-no",
      },
      {
        type: "food",
        url: "https://lh3.googleusercontent.com/gps-cs-s/AHVAweo5HzIv8Lab-brdFl46liFtWHJY24XUbNjGoks_AhnzydxIDiJeeJQdgHgualiZFnuySMGZfYy0jgR3IibzqHth-rmUKkY4mHzwmC1CExAySfBBkJ6U4sLUC3MSCuK87v_npcI=w408-h244-k-no",
      },
      {
        type: "promo",
        url: "https://lh3.googleusercontent.com/gps-cs-s/AHVAweo5HzIv8Lab-brdFl46liFtWHJY24XUbNjGoks_AhnzydxIDiJeeJQdgHgualiZFnuySMGZfYy0jgR3IibzqHth-rmUKkY4mHzwmC1CExAySfBBkJ6U4sLUC3MSCuK87v_npcI=w408-h244-k-no",
        title: "活动宣传",
      },
    ],
  },
  {
    id: "food-gaolaojiu-hotpot-ratchada",
    nameZh: "Greenbelt 3 - Ayala Malls",
    cityZh: "马尼拉",
    googleUrl:
      "https://www.google.com/maps/place/Greenbelt+3+-+Ayala+Malls/@14.5517529,121.0191095,17z/data=!3m1!4b1!4m6!3m5!1s0x3397c9100a5df8dd:0x1139154a2d608971!8m2!3d14.5517529!4d121.0216898!16s%2Fg%2F11bbx0hx80?entry=ttu&g_ep=EgoyMDI2MDIwMS4wIKXMDSoKLDEwMDc5MjA2N0gBUAM%3D",
    addressZh: "167/17-20 Ratchadaphisek Rd, Din Daeng, Bangkok 10400",
    category: "购物中心",
    tags: ["购物中心"],
    rating: 4.5,
    priceText: "฿2,000+",
    openTimeHint: "16:00 后营业",
    images: [
      {
        type: "cover",
        url: "https://lh3.googleusercontent.com/gps-cs-s/AHVAweqXiXu_dybd3-t7NyKGupnjaVZjVxTjPOHzZhTNnhntQt8H-AUNfMALXGtffcaTArOHWxqXG7aAvU6Nf7mydF6k4bFX-xqAt-FDZRrayg8wA02vhgqIXFpW85XGY8drO-lTCqPz=w408-h306-k-no",
        title: "马尼拉",
      },
    ],
  },
];

const viFranchises: Franchise[] = [
  {
    id: "cn-dongbei-dumpling-ratchada",
    nameZh: "越南风味餐馆",
    cityZh: "河内",
    tags: ["酒店"],
    googleUrl: "https://www.google.com/maps/place/B%C3%BAn+ch%E1%BA%A3+H%C6%B0%C6%A1ng+Li%C3%AAn/@21.0173572,105.845695,15z/data=!4m9!1m2!2m1!1z6LaK5Y2X6aOO5ZGz6aSQ6aaG!3m5!1s0x3135abf2a4ba685d:0x7e67963f30fa90e7!8m2!3d21.0181373!4d105.8538926!16s%2Fg%2F1hm5x9fjz?entry=ttu&g_ep=EgoyMDI2MDIwMS4wIKXMDSoKLDEwMDc5MjA2N0gBUAM%3D",
    addressZh: "Ratchadaphisek Rd · Huai Khwang · Bangkok 10320",
    category: "酒店",
    rating: 3.3,
    priceText: "฿3,000+",
    openTimeHint: "营业至 04:00",
    images: [
      {
        type: "cover",
        url: "https://lh3.googleusercontent.com/gps-cs-s/AHVAwepW_pvBoapNjs_DlKSh3diaG0YqCatjcqlMFAfzkxYPIxE-buvYhrk-F1gJSQQt5Xb106v7zes8Lw1iJ3m9TiUAkUYWYlgUG4uX5ZD8jMx8V-UYF3zg-CY7LAreJQk1dTmqUlcsxW3GXwsd=w408-h541-k-no",
        title: "越南风味餐馆",
      },
    ],
  },
  {
    id: "food_321bbq_ratchada",
    nameZh: "越南某烧烤店",
    cityZh: "河内",
    googleUrl:
      "https://www.google.com/maps/place/B%C3%B2+N%C6%B0%E1%BB%9Bng+Than+Hoa+A+Cho%C3%A9n+-+C%C6%A1+s%E1%BB%9F+4+-+V%C3%B5+Th%E1%BB%8B+S%C3%A1u/@21.0173673,105.8467069,15.19z/data=!4m9!1m2!2m1!1z6LaK5Y2X6aOO5ZGz6aSQ6aaG!3m5!1s0x3135ad46c285e887:0xe9788ba8fe6d40fb!8m2!3d21.0068849!4d105.8547518!16s%2Fg%2F11shnmzp9n?entry=ttu&g_ep=EgoyMDI2MDIwMS4wIKXMDSoKLDEwMDc5MjA2N0gBUAM%3D",
    addressZh: "260 Ratchadaphisek Rd, Huai Khwang, Bangkok 10310",
    category: "烧烤",
    tags: ["酒店"],
    rating: 3.7,
    priceText: "฿2,000+",
    openTimeHint: "16:00 后营业",
    images: [
      {
        type: "cover",
        url: "https://lh3.googleusercontent.com/gps-cs-s/AHVAwerHR4Uk75DlLPz9XPKvYxhKS8A6Q20b0vlz1dy5KFwngsUVRHZCcrGHJcQ38vPP9YGFbdc50Xtr3l-rAcugNyUYOdqOGZjoJ720ltSIU6SZjxNwZst-U-r15GU-fc--HOdfkO_uYmEW44c=w408-h306-k-no",
        title: "321BBQ 门店",
      },
      {
        type: "environment",
        url: "https://lh3.googleusercontent.com/gps-cs-s/AHVAweo5HzIv8Lab-brdFl46liFtWHJY24XUbNjGoks_AhnzydxIDiJeeJQdgHgualiZFnuySMGZfYy0jgR3IibzqHth-rmUKkY4mHzwmC1CExAySfBBkJ6U4sLUC3MSCuK87v_npcI=w408-h244-k-no",
      },
      {
        type: "food",
        url: "https://lh3.googleusercontent.com/gps-cs-s/AHVAweo5HzIv8Lab-brdFl46liFtWHJY24XUbNjGoks_AhnzydxIDiJeeJQdgHgualiZFnuySMGZfYy0jgR3IibzqHth-rmUKkY4mHzwmC1CExAySfBBkJ6U4sLUC3MSCuK87v_npcI=w408-h244-k-no",
      },
      {
        type: "promo",
        url: "https://lh3.googleusercontent.com/gps-cs-s/AHVAweo5HzIv8Lab-brdFl46liFtWHJY24XUbNjGoks_AhnzydxIDiJeeJQdgHgualiZFnuySMGZfYy0jgR3IibzqHth-rmUKkY4mHzwmC1CExAySfBBkJ6U4sLUC3MSCuK87v_npcI=w408-h244-k-no",
        title: "活动宣传",
      },
    ],
  },
  {
    id: "food-gaolaojiu-hotpot-ratchada",
    nameZh: "玉皇殿",
    cityZh: "胡志明",
    googleUrl:
      "https://www.google.com/maps/place/%E7%8E%89%E7%9A%87%E6%AE%BF/@10.8045381,106.6802913,13.79z/data=!4m9!1m2!2m1!1z6IOh5b-X5piO!3m5!1s0x317529195cdbf761:0x38eda92ced03088d!8m2!3d10.7919963!4d106.6981791!16s%2Fm%2F0dgn7sx?entry=ttu&g_ep=EgoyMDI2MDIwMS4wIKXMDSoKLDEwMDc5MjA2N0gBUAM%3D",
    addressZh: "167/17-20 Ratchadaphisek Rd, Din Daeng, Bangkok 10400",
    category: "宝塔",
    tags: ["宝塔"],
    rating: 4.5,
    priceText: "฿2,000+",
    openTimeHint: "16:00 后营业",
    images: [
      {
        type: "cover",
        url: "https://lh3.googleusercontent.com/gps-cs-s/AHVAwepBWDXmbwLIZ_MTs2xbE-YCajuQiKlhWQpu_NVqGyTo69AOOua-RVbMRnEFUtqw6Q1rz17qgo1VNAv85yYQ36tqoqV9I-hixy1Qhj94IGOfmk8935GzuwIkAbGn5cnQjBQJKwL2iw=w408-h306-k-no",
        title: "胡志明",
      },
    ],
  },
];


export const franchiseCountries: FranchiseCountry[] = [
  { id: "th", name: "泰国", sort: 0, franchises: thFranchises },

  // 你后面会补数据：先占位
  { id: "la", name: "老挝", sort: 10, franchises: laoFranchises },
  { id: "vn", name: "越南", sort: 20, franchises: viFranchises },
  { id: "ph", name: "菲律宾", sort: 30, franchises: phpFranchises },
  { id: "kh", name: "柬埔寨", sort: 40, franchises: [] },
];

// 如果你旧代码还在用 franchises（扁平），给个兼容导出：默认泰国
export const franchises: Franchise[] = thFranchises;
