/// <reference types="astro/client" />

declare namespace App {
    interface Locals {
        local_ip: string;
        ip: string;
        referer: string;
        clientIP: string;
    }
}

declare module "astro:env/server" {
    // 你想要从 astro:env/server 解构导入的名字，都要在这声明
    export const LOCAL_DEV_SITE_URL: string
    export const SITE_URL_TAG: string
    export const ONLINE_PROD_SITE_URL: string
    export const ENCRYPT: string
    export const DOCKER_PROXY_IP: string
    export const PROD_SITE_URL: string
    export const SITE_URL: string
    export const LOG_BASE_DIR: string
    export const LOG_LEVEL: string
    export const LOG_TO_STDOUT: string
    export const TG_BOT_TOKEN: string
    export const TG_CHAT_ID: string
    export const TG_CHAT_TITLE: string
    export const PERF_TG_ON: string 
    // 还可以保留官方提供的 API
    export function getSecret(name: string): string | undefined
}
