import axios from 'axios'
import { HttpsProxyAgent } from "https-proxy-agent";
import nodeFetch from "@/services/service.node-fetch";

export async function serverTime() {
  const { PROD_SITE_URL, SITE_URL_TAG, DOCKER_PROXY_IP } = await import("astro:env/server");

  const agent = new HttpsProxyAgent(DOCKER_PROXY_IP);

  const dockerNetAgentOptions =
    // DOCKER_PROXY_NET 让运维加到docker-compose的环境变量里面了，所以本地没有
    process.env.DOCKER_PROXY_NET === "true"
      ? {
        httpsAgent: agent,
        httpAgent: agent,
        timeout: 8000,
      }
      : {};
  return axios.get(`${PROD_SITE_URL}/${SITE_URL_TAG}/user/serverTime`, {
    // ...dockerNetAgentOptions,
  })
}

export function getKvConfig(params: any, opt: any) {
  return nodeFetch.post("/common/kv/config", params, opt);
}

export default {
  getKvConfig,
  serverTime
};