export type FranchiseImage = {
  type: 'cover' | 'promo' | 'environment' | 'food'
  url: string
  title?: string
  order?: number
}

export type Franchise = {
  /** 基础信息（你原来的） */
  id: string
  nameZh: string
  cityZh: string
  addressZh: string

  googleUrl: string;

  /** 扩展信息（可选，不影响旧代码） */
  category?: string
  tags?: string[]
  rating?: number
  priceText?: string
  openTimeHint?: string

  /** 宣传 / 展示图 */
  images?: FranchiseImage[]
}

export const franchises: Franchise[] = [
  {
    id: "cn-dongbei-dumpling-ratchada",
    nameZh: "东北老妈饺子馆（拉差达）",
    cityZh: "曼谷",
    googleUrl: 'https://www.google.com/maps/place/%E4%B8%9C%E5%8C%97%E8%80%81%E5%A6%88%E9%A5%BA%E5%AD%90%E9%A6%86+%E0%B8%A3%E0%B9%89%E0%B8%B2%E0%B8%99%E0%B8%AD%E0%B8%B2%E0%B8%AB%E0%B8%B2%E0%B8%A3%E0%B8%9A%E0%B8%B1%E0%B8%A7%E0%B9%82%E0%B8%A0%E0%B8%8A%E0%B8%99%E0%B8%B2/@13.7784292,100.5712402,17z/data=!3m1!4b1!4m6!3m5!1s0x30e29e801d14ec8f:0xe1faab4eb014b63c!8m2!3d13.778424!4d100.5738151!16s%2Fg%2F11c1mkz34r?entry=ttu&g_ep=EgoyMDI2MDEyOC4wIKXMDSoASAFQAw%3D%3D',
    addressZh: "Ratchadaphisek Rd · Huai Khwang · Bangkok 10320",
    category: "中餐馆 · 饺子",
    rating: 3.3,
    priceText: '฿3,000+',
    openTimeHint: "营业至 04:00",
    images: [
      {
        type: 'cover',
        url: 'https://lh3.googleusercontent.com/p/AF1QipPFPvevm92x3dAijdo4qm1L_tZtzH6pHnjdp26a=w517-h240-k-no',
        title: '321BBQ 门店'
      }
    ]
  },

  {
    id: 'food_321bbq_ratchada',
    nameZh: '321BBQ（拉差达）',
    cityZh: '曼谷',
    googleUrl: 'https://www.google.com/maps/place/321BBQ%EF%BC%88Ratchada%EF%BC%89/@13.7827548,100.5692679,17z/data=!3m1!4b1!4m6!3m5!1s0x30e29f81854024df:0x615ecbc59921e90d!8m2!3d13.7827496!4d100.5741388!16s%2Fg%2F11r_6_28fs?entry=ttu&g_ep=EgoyMDI2MDEyOC4wIKXMDSoASAFQAw%3D%3D',
    addressZh: '260 Ratchadaphisek Rd, Huai Khwang, Bangkok 10310',
    category: '烧烤',
    tags: ['烧烤', 'BBQ', '夜宵', '聚餐'],
    rating: 3.7,
    priceText: '฿2,000+',
    openTimeHint: '16:00 后营业',
    images: [
      {
        type: 'cover',
        url: 'https://lh3.googleusercontent.com/gps-cs-s/AHVAweo5HzIv8Lab-brdFl46liFtWHJY24XUbNjGoks_AhnzydxIDiJeeJQdgHgualiZFnuySMGZfYy0jgR3IibzqHth-rmUKkY4mHzwmC1CExAySfBBkJ6U4sLUC3MSCuK87v_npcI=w408-h244-k-no',
        title: '321BBQ 门店'
      },
      {
        type: 'environment',
        url: 'https://lh3.googleusercontent.com/gps-cs-s/AHVAweo5HzIv8Lab-brdFl46liFtWHJY24XUbNjGoks_AhnzydxIDiJeeJQdgHgualiZFnuySMGZfYy0jgR3IibzqHth-rmUKkY4mHzwmC1CExAySfBBkJ6U4sLUC3MSCuK87v_npcI=w408-h244-k-no'
      },
      {
        type: 'food',
        url: 'https://lh3.googleusercontent.com/gps-cs-s/AHVAweo5HzIv8Lab-brdFl46liFtWHJY24XUbNjGoks_AhnzydxIDiJeeJQdgHgualiZFnuySMGZfYy0jgR3IibzqHth-rmUKkY4mHzwmC1CExAySfBBkJ6U4sLUC3MSCuK87v_npcI=w408-h244-k-no'
      },
      {
        type: 'promo',
        url: 'https://lh3.googleusercontent.com/gps-cs-s/AHVAweo5HzIv8Lab-brdFl46liFtWHJY24XUbNjGoks_AhnzydxIDiJeeJQdgHgualiZFnuySMGZfYy0jgR3IibzqHth-rmUKkY4mHzwmC1CExAySfBBkJ6U4sLUC3MSCuK87v_npcI=w408-h244-k-no',
        title: '活动宣传'
      }
    ]
  },
  {
    id: "food-gaolaojiu-hotpot-ratchada",
    nameZh: "高老九火锅店",
    cityZh: "曼谷",
    googleUrl: 'https://www.google.com/maps/place/%E0%B8%89%E0%B8%87%E0%B8%8A%E0%B8%B4%E0%B9%88%E0%B8%87%E0%B9%80%E0%B8%81%E0%B8%B2%E0%B9%80%E0%B8%81%E0%B9%89%E0%B8%B2/@13.7763742,100.5706064,17z/data=!3m1!4b1!4m6!3m5!1s0x30e29f179b46d811:0x925c86241548588!8m2!3d13.776369!4d100.5731813!16s%2Fg%2F11tnwl3520?entry=ttu&g_ep=EgoyMDI2MDEyOC4wIKXMDSoASAFQAw%3D%3D',
    addressZh: "167/17-20 Ratchadaphisek Rd, Din Daeng, Bangkok 10400",
    category: "火锅",
    tags: ["火锅", "中餐", "聚餐"],
    rating: 4.5,
    priceText: '฿2,000+',
    openTimeHint: '16:00 后营业',
    images: [
      { type: "cover", url: "https://lh3.googleusercontent.com/p/AF1QipN5DH-h9U40F_jPzs_Ui4g-k4nTy-ibWYVyAxUv=w426-h240-k-no", title: "高老九火锅店" }
    ]
  },
  {
    id: "food-xiaolongkan-hotpot-huaikhwang",
    nameZh: "小龙坎火锅（曼谷谷店）",
    cityZh: "曼谷",
    googleUrl: 'https://www.google.com/maps/place/xiaolongkan%E5%B0%8F%E9%BE%99%E5%9D%8E%E6%9B%BC%E8%B0%B7%E5%BA%97/@13.7764593,100.5319815,13z/data=!4m10!1m2!2m1!1z5bCP6b6Z5Z2O!3m6!1s0x30e29f1d79d70fc7:0x379d2a7b25821e32!8m2!3d13.7450688!4d100.5845667!15sCgnlsI_pvpnlnY5aDCIK5bCP6b6ZIOWdjpIBEmhvdF9wb3RfcmVzdGF1cmFudOABAA!16s%2Fg%2F11l1dsfj2w?entry=ttu&g_ep=EgoyMDI2MDEyOC4wIKXMDSoASAFQAw%3D%3D',
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
        title: "小龙坎门店"
      }
    ]
  },

  {
    id: "mall-maya-chiangmai",
    nameZh: "玛雅购物中心",
    cityZh: "清迈",
    googleUrl: 'https://www.google.com/maps/place/%E7%8E%9B%E9%9B%85%E8%B4%AD%E7%89%A9%E4%B8%AD%E5%BF%83/@18.8018836,98.9651546,17z/data=!3m1!4b1!4m6!3m5!1s0x30da3a61c9365a0b:0x248e54e7878f327e!8m2!3d18.8018785!4d98.9677295!16s%2Fg%2F1yprv63cp?entry=ttu&g_ep=EgoyMDI2MDEyOC4wIKXMDSoASAFQAw%3D%3D',
    addressZh: "55 Huay Kaew Rd, Suthep, Mueang Chiang Mai District, Chiang Mai 50200",
    category: "购物中心",
    tags: ["购物中心", "商场", "餐饮", "购物"],
    rating: 4.4,
    images: [
      {
        type: "cover",
        url: "https://lh3.googleusercontent.com/gps-cs-s/AHVAwepnXt34-GiQqpmc_7k-X5M9_6rqhmySbubs4-s3U3AfLsZPLbV1QTZ7YJlM_Xgb62inNoo_qdiS5IdQoCXUbmhIfDwsXmmCZdPduBamyKg6QrzE67FqdpWBczIFxP_Zu9nmTUGiYaAa5AvJ=w408-h265-k-no",
        title: "玛雅购物中心"
      }
    ]
  },

  {
    id: "food-lily-kitchen-pattaya",
    nameZh: "李家厨房 Lily's Kitchen",
    cityZh: "芭提雅",
    googleUrl: `https://www.google.com/maps/place/%E6%9D%8E%E5%AE%B6%E5%8E%A8%E6%88%BF+lily's+kitchen/@12.9423533,100.8851395,17z/data=!4m10!1m2!2m1!1z5p2O5a625Y6o5oi_!3m6!1s0x31029718ab4b841b:0x7124bc584bc53547!8m2!3d12.9423042!4d100.8881328!15sCgzmnY7lrrbljqjmiL9aECIO5p2OIOWutiDljqjmiL-SARJjaGluZXNlX3Jlc3RhdXJhbnTgAQA!16s%2Fg%2F11y2mm289m?entry=ttu&g_ep=EgoyMDI2MDEyOC4wIKXMDSoASAFQAw%3D%3D`,
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
        title: "李家厨房 门店外观"
      }
    ]
  }


]

