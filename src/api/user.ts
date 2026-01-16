import nodeFetch from "@/services/service.node-fetch";

export function getKvConfig(params: any, opt: any) {
  return nodeFetch.post("/common/kv/config", params, opt);
}

export default {
  getKvConfig,
};