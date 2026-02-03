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
  lat: number
  lng: number
  cityZh: string
  addressZh: string

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
    lat: 13.7784292,
    lng: 100.5712402,
    cityZh: "曼谷",
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
    lat: 13.7649,
    lng: 100.5676,
    cityZh: '曼谷',
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
    lat: 13.7763331,
    lng: 100.5731931,
    cityZh: "曼谷",
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
    lat: 13.7569,
    lng: 100.5656,
    cityZh: "曼谷",
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
    lat: 18.8029,
    lng: 98.9676,
    cityZh: "清迈",
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
    lat: 12.9276,
    lng: 100.8813,
    cityZh: "芭提雅",
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

