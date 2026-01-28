import { google } from "googleapis";
import { HttpsProxyAgent } from "https-proxy-agent";
import path from 'path'
import fs from 'fs'
import dotenv from 'dotenv'
import { site_config } from '../config/site.config.mjs'

const APP_ENV = String(process.env.APP_ENV || process.env.NODE_ENV || '').trim().toLowerCase();

console.log(APP_ENV, 'APP_ENV')

console.log(site_config(APP_ENV).DOCKER_PROXY_IP.default, 'site_config')

const proxyAgent = new HttpsProxyAgent(site_config(APP_ENV).DOCKER_PROXY_IP.default);

export function replaceAwsSecrets() {
  const ACCESS_PLACEHOLDER = "/#AWS_ACCESS_KEY#/";
  const SECRET_PLACEHOLDER = "/#AWS_SECRET_KEY#/";

  const sheetId = site_config(APP_ENV).VITE_GOOGLE_SHEET_ID.default;
  const range = "AWS!A:C";

  // ✅ 你的项目名：必须和表格 A 列一致
  const project = process.env.APP_NAME || "yh-procurement-system";

  // ✅ 缓存：build 期间只拉一次
  let cached = null;

  async function fetchKeysFromPrivateSheet() {
    if (cached) return cached;

    const auth = new google.auth.JWT({
      // ✅ 注意：trim 去掉空格
      email: site_config(APP_ENV).VITE_GOOGLE_EMAIL.default,
      key: site_config(APP_ENV).VITE_GOOGLE_KEY.default,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
      clientOptions: {
        agent: proxyAgent,
      },
    });

    const sheets = google.sheets({ version: "v4", auth });

    const resp = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range,
    });

    const values = resp.data.values || [];
    if (values.length < 2) throw new Error("[vite] Sheet has no data rows");

    let accessKey = "";
    let secretKey = "";

    for (let i = 1; i < values.length; i++) {
      const row = values[i] || [];
      if (String(row[0] || "").trim() === project) {
        accessKey = String(row[1] || "").trim();
        secretKey = String(row[2] || "").trim();
        break;
      }
    }

    if (!accessKey || !secretKey) {
      throw new Error(`[vite] Project "${project}" not found or keys empty in ${range}`);
    }

    cached = { accessKey, secretKey };
    return cached;
  }

  return {
    name: "vite:replace-aws-secrets",
    apply: "build",
    enforce: "pre",

    async buildStart() {
      // ✅ build 开始先拉一次，失败直接中止
      await fetchKeysFromPrivateSheet();
    },

    async transform(code, id) {
      const cleanId = id.split("?")[0];

      if (!/\.(js|ts|vue|mjs|cjs)$/.test(cleanId)) return null;
      if (!code.includes(ACCESS_PLACEHOLDER) && !code.includes(SECRET_PLACEHOLDER)) return null;

      const { accessKey, secretKey } = await fetchKeysFromPrivateSheet();

      let replaced = code;
      replaced = replaced.replaceAll(ACCESS_PLACEHOLDER, accessKey);
      replaced = replaced.replaceAll(SECRET_PLACEHOLDER, secretKey);

      return { code: replaced, map: null };
    },
  };
}
