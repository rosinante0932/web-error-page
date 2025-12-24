import { DOCKER_PROXY_IP } from "astro:env/server";
import { HttpsProxyAgent } from "https-proxy-agent";

const proxy = DOCKER_PROXY_IP; // 你的代理地址
const agent = new HttpsProxyAgent(proxy);

const dockerNetAgentOptions =
    // DOCKER_PROXY_NET 让运维加到docker-compose的环境变量里面了，所以本地没有
    process.env.DOCKER_PROXY_NET === "true"
        ? {
            httpsAgent: agent,
            httpAgent: agent,
            timeout: 8000,
        }
        : {};

export {
    dockerNetAgentOptions
}