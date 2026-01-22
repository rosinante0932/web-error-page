import { envField } from "astro/config";

export const site_config = (env = "dev") => {
  const config = {
    test: {
      BOSS: envField.string({
        context: "server",
        access: "secret",
        default: "SandBox",
      }),
      PUBLIC_SITE_NAME: envField.string({
        context: "server",
        access: "secret",
        default: "AstroVue",
      }),
      DEVELOPER: envField.string({
        context: "server",
        access: "secret",
        default: "Rosinante",
      }),
      APP_ENV: envField.string({
        context: "server",
        access: "secret",
        default: "test",
      }),
      PORT: envField.string({
        context: "server",
        access: "secret",
        default: "80",
      }),
      SITE_URL: envField.string({
        context: "server",
        access: "secret",
        default: "https://www.change-easy-v1.com",
      }),
      PROD_SITE_URL: envField.string({
        context: "server",
        access: "secret",
        default: "http://ec-app-gateway:8080",
      }),
      DOCKER_PROXY_IP: envField.string({
        context: "server",
        access: "secret",
        default: "http://172.30.32.207:13080",
      }),
      SITE_URL_TAG: envField.string({
        context: "server",
        access: "secret",
        default: "gw",
      }),
      ENCRYPT: envField.string({
        context: "server",
        access: "secret",
        default: "false",
      }),

      LOG_BASE_DIR: envField.string({
        context: "server",
        access: "secret",
        default: "/logs",
      }),

      LOG_LEVEL: envField.string({
        context: "server",
        access: "secret",
        default: "info",
      }),

      LOG_TO_STDOUT: envField.string({
        context: "server",
        access: "secret",
        default: "true",
      }),


      TG_BOT_TOKEN: envField.string({
        context: "server",
        access: "secret",
        default: "8476025793:AAFjkxZaS4TD_dxv4s3Mf7nlqHnBH220dOI",
      }),

      TG_CHAT_ID: envField.string({
        context: "server",
        access: "secret",
        default: "-1003287447129",
      }),

      TG_CHAT_TITLE: envField.string({
        context: "server",
        access: "secret",
        default: "403 日志告警（测试）",
      }),

      PERF_TG_ON: envField.string({
        context: "server",
        access: "secret",
        default: "true",
      }),
      
    },
    rc: {
      BOSS: envField.string({
        context: "server",
        access: "secret",
        default: "SandBox",
      }),
      PUBLIC_SITE_NAME: envField.string({
        context: "server",
        access: "secret",
        default: "AstroVue",
      }),
      DEVELOPER: envField.string({
        context: "server",
        access: "secret",
        default: "Rosinante",
      }),
      APP_ENV: envField.string({
        context: "server",
        access: "secret",
        default: "rc",
      }),
      PORT: envField.string({
        context: "server",
        access: "secret",
        default: "80",
      }),
      SITE_URL: envField.string({
        context: "server",
        access: "secret",
        default: "https://uat3.change-easy-v1.com/",
      }),
      PROD_SITE_URL: envField.string({
        context: "server",
        access: "secret",
        default: "http://ec-app-gateway:8080",
      }),
      DOCKER_PROXY_IP: envField.string({
        context: "server",
        access: "secret",
        default: "http://10.108.16.66:13080",
      }),
      SITE_URL_TAG: envField.string({
        context: "server",
        access: "secret",
        default: "gw",
      }),
      ENCRYPT: envField.string({
        context: "server",
        access: "secret",
        default: "true",
      }),
      LOG_BASE_DIR: envField.string({
        context: "server",
        access: "secret",
        default: "/logs",
      }),

      LOG_LEVEL: envField.string({
        context: "server",
        access: "secret",
        default: "info",
      }),

      LOG_TO_STDOUT: envField.string({
        context: "server",
        access: "secret",
        default: "true",
      }),

      TG_BOT_TOKEN: envField.string({
        context: "server",
        access: "secret",
        default: "8476025793:AAFjkxZaS4TD_dxv4s3Mf7nlqHnBH220dOI",
      }),

      TG_CHAT_ID: envField.string({
        context: "server",
        access: "secret",
        default: "-1003287447129",
      }),

      TG_CHAT_TITLE: envField.string({
        context: "server",
        access: "secret",
        default: "403 日志告警（预发）",
      }),

      PERF_TG_ON: envField.string({
        context: "server",
        access: "secret",
        default: "true",
      }),
    },
    prod: {
      BOSS: envField.string({
        context: "server",
        access: "secret",
        default: "SandBox",
      }),
      PUBLIC_SITE_NAME: envField.string({
        context: "server",
        access: "secret",
        default: "AstroVue",
      }),
      DEVELOPER: envField.string({
        context: "server",
        access: "secret",
        default: "Rosinante",
      }),
      APP_ENV: envField.string({
        context: "server",
        access: "secret",
        default: "prod",
      }),
      PORT: envField.string({
        context: "server",
        access: "secret",
        default: "80",
      }),
      SITE_URL: envField.string({
        context: "server",
        access: "secret",
        default: "https://www.change-easy-v1.com",
      }),
      PROD_SITE_URL: envField.string({
        context: "server",
        access: "secret",
        default: "http://ec-app-gateway:8080",
      }),
      DOCKER_PROXY_IP: envField.string({
        context: "server",
        access: "secret",
        default: "http://172.30.32.207:13080",
      }),
      SITE_URL_TAG: envField.string({
        context: "server",
        access: "secret",
        default: "gw",
      }),
      ENCRYPT: envField.string({
        context: "server",
        access: "secret",
        default: "true",
      }),

      LOG_BASE_DIR: envField.string({
        context: "server",
        access: "secret",
        default: "/logs",
      }),

      LOG_LEVEL: envField.string({
        context: "server",
        access: "secret",
        default: "info",
      }),

      LOG_TO_STDOUT: envField.string({
        context: "server",
        access: "secret",
        default: "true",
      }),

      TG_BOT_TOKEN: envField.string({
        context: "server",
        access: "secret",
        default: "8476025793:AAFjkxZaS4TD_dxv4s3Mf7nlqHnBH220dOI",
      }),

      TG_CHAT_ID: envField.string({
        context: "server",
        access: "secret",
        default: "-1003287447129",
      }),

      TG_CHAT_TITLE: envField.string({
        context: "server",
        access: "secret",
        default: "403 日志告警（生产）",
      }),

      PERF_TG_ON: envField.string({
        context: "server",
        access: "secret",
        default: "true",
      }),
    },
  };
  return config[env];
};
