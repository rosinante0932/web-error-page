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
    },
  };
  return config[env];
};
