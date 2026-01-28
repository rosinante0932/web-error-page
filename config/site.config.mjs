import { envField } from "astro/config";

export const site_config = (env = "test") => {
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
        default: "false",
      }),

      VITE_GOOGLE_SHEET_ID: envField.string({
        context: "server",
        access: "secret",
        default: "17x1boPPRpnZE1lWkYq0HcvPn7f9RaUhI30bIbv2a9gU",
      }),

      VITE_GOOGLE_EMAIL: envField.string({
        context: "server",
        access: "secret",
        default: "hx-secret@gen-lang-client-0701158353.iam.gserviceaccount.com",
      }),

      VITE_GOOGLE_KEY: envField.string({
        context: "server",
        access: "secret",
        default: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCkclWFHgcHJmai\nfOX/Qq1Jt1qAZgrTwkQD+/Du/dnQD5cwIMBhOk4zc846Q0/xwSPxKstoCButCS58\nCC9XD+77+d1bw8AnOM/6GCzTSgDpwtr6Z5wRj5Agq0naNc5f1oF4mTcqR695Td4g\nohpG+Ixc4D+a7N71bYVqLrnlbf31nzi/zmaMCFEu/INX57Rx/YHtEToYsEWfvZR3\nh3GZvs9zN8hkMeFAX3uE+vLLI60SO+uz9T0Wbyas6vjJxak2duPxBnzLt+ABcN2z\nmjLWEMHHM5SUYBl+63vhcaRgSfIlPGcmf8MYfQj8YFDXMPUkAJWnoLLBCMcOUIe6\nmoYVXdYzAgMBAAECggEAD9dueEhlkkFsxF0WevnytOs+Lf2mhV0YLZoTolzp9//I\nfLvATJ16nbzw3O6nFjmY5h6ilv77oOEFjVqXKjfquci0PlF5LU4XxZaWmt7CKm1k\nUu2wPIYr8uRiqkFiBBwnP3WNuZD2TSU8hMBDmm/5yuiqDUP2+9r1GJQvwZ5QR1z2\nNQ1gKIxa8nEFCk52mtDROSXCVa2R7sedCieyX20eylU2BZAGm7AoMgFra/qqwCle\n79MiR1syK03S8HHHD6fa3gY3kl+lHToDjdPTAVaZ2q6xpa61CNh+EhXCoDZdXa+2\nYh6FvLEHktyt3BkeY3gJAzgl2iSB/siLdLmeei7wwQKBgQDjGAp3xoyEh7Ynedoi\nOANNFXAXQdxCiaVqRV7UXQs2e2cfPAvlLKgtbJ5zJDpVEMNMlZbug9j3HRcCo4xR\nrZKqxZ65/57cn4bkKZ0kMOvYGYNpfVP2oidavT+YcCyX4dNjhw1RTEbeEeDU6DMx\nhs87F2d/SVe8p8iB2MeNW9xr2QKBgQC5YOcGss9ntTme0+ipXmMJrCXjR+/fHluX\nf6ierao1WPh+Hcr8Tgx2gKRm4ynzDxc7bW+vTYoRPOROdFHMsMgdd0TuntKWMF8M\nhb4XW0eZ/O0IXV9Jbd64NDSqwaHbbHTML36rTRmAj2MtuS74kwnP+ECeXseiaEQ+\nATFLSmXG6wKBgGyn6xJGCKO8v1YCAnHO9R1jvX8TPw0DCQdg66+WWTAXOU8Djvl3\nNXyOdP3IfrSG0bsJ8+5pXV1XKNRVZmUKNJvK9FgwS1VqasMuegZ/9cgu5OaLVaoz\nCbtrw0rvmRaOsXL0glW8tke4rCeSdjQjOXIfj6Cief1FFjWygEBNjJh5AoGAQ8Ji\nz7T+UMcSN7b3fSkOBFQTST9bM2/yRK8Z4F5UL8nEkryrHIwezBX7gcwY4koq0MMQ\npsAt7l0WioLD/5DCpNqarKoLCXDG3VnpgLoRsvybW4pdsQZi+WvDsIK0efLrwlK9\n9zloT/CZbPYacCu203jHjdvRFtEL2Kow7XdVOl8CgYEAnPwlX4SBFZc7gwWn/15E\npn3Ks3OefMh2ndz0lBlg7YSHypqkMi4Y8gHhnazfHbmlDDvzrUg4eRo4qBkm/+CB\nEMbB1V9bI5fp1/S8Bg+4XTF/7tlCZMKy/xOLdl7CgDE3l7HSzDUGSOsYdtS/R1rh\nySFXxuC0f9GhGGheOFLX874=\n-----END PRIVATE KEY-----\n",
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

      VITE_GOOGLE_SHEET_ID: envField.string({
        context: "server",
        access: "secret",
        default: "17x1boPPRpnZE1lWkYq0HcvPn7f9RaUhI30bIbv2a9gU",
      }),

      VITE_GOOGLE_EMAIL: envField.string({
        context: "server",
        access: "secret",
        default: "hx-secret@gen-lang-client-0701158353.iam.gserviceaccount.com",
      }),

      VITE_GOOGLE_KEY: envField.string({
        context: "server",
        access: "secret",
        default: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCkclWFHgcHJmai\nfOX/Qq1Jt1qAZgrTwkQD+/Du/dnQD5cwIMBhOk4zc846Q0/xwSPxKstoCButCS58\nCC9XD+77+d1bw8AnOM/6GCzTSgDpwtr6Z5wRj5Agq0naNc5f1oF4mTcqR695Td4g\nohpG+Ixc4D+a7N71bYVqLrnlbf31nzi/zmaMCFEu/INX57Rx/YHtEToYsEWfvZR3\nh3GZvs9zN8hkMeFAX3uE+vLLI60SO+uz9T0Wbyas6vjJxak2duPxBnzLt+ABcN2z\nmjLWEMHHM5SUYBl+63vhcaRgSfIlPGcmf8MYfQj8YFDXMPUkAJWnoLLBCMcOUIe6\nmoYVXdYzAgMBAAECggEAD9dueEhlkkFsxF0WevnytOs+Lf2mhV0YLZoTolzp9//I\nfLvATJ16nbzw3O6nFjmY5h6ilv77oOEFjVqXKjfquci0PlF5LU4XxZaWmt7CKm1k\nUu2wPIYr8uRiqkFiBBwnP3WNuZD2TSU8hMBDmm/5yuiqDUP2+9r1GJQvwZ5QR1z2\nNQ1gKIxa8nEFCk52mtDROSXCVa2R7sedCieyX20eylU2BZAGm7AoMgFra/qqwCle\n79MiR1syK03S8HHHD6fa3gY3kl+lHToDjdPTAVaZ2q6xpa61CNh+EhXCoDZdXa+2\nYh6FvLEHktyt3BkeY3gJAzgl2iSB/siLdLmeei7wwQKBgQDjGAp3xoyEh7Ynedoi\nOANNFXAXQdxCiaVqRV7UXQs2e2cfPAvlLKgtbJ5zJDpVEMNMlZbug9j3HRcCo4xR\nrZKqxZ65/57cn4bkKZ0kMOvYGYNpfVP2oidavT+YcCyX4dNjhw1RTEbeEeDU6DMx\nhs87F2d/SVe8p8iB2MeNW9xr2QKBgQC5YOcGss9ntTme0+ipXmMJrCXjR+/fHluX\nf6ierao1WPh+Hcr8Tgx2gKRm4ynzDxc7bW+vTYoRPOROdFHMsMgdd0TuntKWMF8M\nhb4XW0eZ/O0IXV9Jbd64NDSqwaHbbHTML36rTRmAj2MtuS74kwnP+ECeXseiaEQ+\nATFLSmXG6wKBgGyn6xJGCKO8v1YCAnHO9R1jvX8TPw0DCQdg66+WWTAXOU8Djvl3\nNXyOdP3IfrSG0bsJ8+5pXV1XKNRVZmUKNJvK9FgwS1VqasMuegZ/9cgu5OaLVaoz\nCbtrw0rvmRaOsXL0glW8tke4rCeSdjQjOXIfj6Cief1FFjWygEBNjJh5AoGAQ8Ji\nz7T+UMcSN7b3fSkOBFQTST9bM2/yRK8Z4F5UL8nEkryrHIwezBX7gcwY4koq0MMQ\npsAt7l0WioLD/5DCpNqarKoLCXDG3VnpgLoRsvybW4pdsQZi+WvDsIK0efLrwlK9\n9zloT/CZbPYacCu203jHjdvRFtEL2Kow7XdVOl8CgYEAnPwlX4SBFZc7gwWn/15E\npn3Ks3OefMh2ndz0lBlg7YSHypqkMi4Y8gHhnazfHbmlDDvzrUg4eRo4qBkm/+CB\nEMbB1V9bI5fp1/S8Bg+4XTF/7tlCZMKy/xOLdl7CgDE3l7HSzDUGSOsYdtS/R1rh\nySFXxuC0f9GhGGheOFLX874=\n-----END PRIVATE KEY-----\n",
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

      VITE_GOOGLE_SHEET_ID: envField.string({
        context: "server",
        access: "secret",
        default: "17x1boPPRpnZE1lWkYq0HcvPn7f9RaUhI30bIbv2a9gU",
      }),

      VITE_GOOGLE_EMAIL: envField.string({
        context: "server",
        access: "secret",
        default: "hx-secret@gen-lang-client-0701158353.iam.gserviceaccount.com",
      }),

      VITE_GOOGLE_KEY: envField.string({
        context: "server",
        access: "secret",
        default: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCkclWFHgcHJmai\nfOX/Qq1Jt1qAZgrTwkQD+/Du/dnQD5cwIMBhOk4zc846Q0/xwSPxKstoCButCS58\nCC9XD+77+d1bw8AnOM/6GCzTSgDpwtr6Z5wRj5Agq0naNc5f1oF4mTcqR695Td4g\nohpG+Ixc4D+a7N71bYVqLrnlbf31nzi/zmaMCFEu/INX57Rx/YHtEToYsEWfvZR3\nh3GZvs9zN8hkMeFAX3uE+vLLI60SO+uz9T0Wbyas6vjJxak2duPxBnzLt+ABcN2z\nmjLWEMHHM5SUYBl+63vhcaRgSfIlPGcmf8MYfQj8YFDXMPUkAJWnoLLBCMcOUIe6\nmoYVXdYzAgMBAAECggEAD9dueEhlkkFsxF0WevnytOs+Lf2mhV0YLZoTolzp9//I\nfLvATJ16nbzw3O6nFjmY5h6ilv77oOEFjVqXKjfquci0PlF5LU4XxZaWmt7CKm1k\nUu2wPIYr8uRiqkFiBBwnP3WNuZD2TSU8hMBDmm/5yuiqDUP2+9r1GJQvwZ5QR1z2\nNQ1gKIxa8nEFCk52mtDROSXCVa2R7sedCieyX20eylU2BZAGm7AoMgFra/qqwCle\n79MiR1syK03S8HHHD6fa3gY3kl+lHToDjdPTAVaZ2q6xpa61CNh+EhXCoDZdXa+2\nYh6FvLEHktyt3BkeY3gJAzgl2iSB/siLdLmeei7wwQKBgQDjGAp3xoyEh7Ynedoi\nOANNFXAXQdxCiaVqRV7UXQs2e2cfPAvlLKgtbJ5zJDpVEMNMlZbug9j3HRcCo4xR\nrZKqxZ65/57cn4bkKZ0kMOvYGYNpfVP2oidavT+YcCyX4dNjhw1RTEbeEeDU6DMx\nhs87F2d/SVe8p8iB2MeNW9xr2QKBgQC5YOcGss9ntTme0+ipXmMJrCXjR+/fHluX\nf6ierao1WPh+Hcr8Tgx2gKRm4ynzDxc7bW+vTYoRPOROdFHMsMgdd0TuntKWMF8M\nhb4XW0eZ/O0IXV9Jbd64NDSqwaHbbHTML36rTRmAj2MtuS74kwnP+ECeXseiaEQ+\nATFLSmXG6wKBgGyn6xJGCKO8v1YCAnHO9R1jvX8TPw0DCQdg66+WWTAXOU8Djvl3\nNXyOdP3IfrSG0bsJ8+5pXV1XKNRVZmUKNJvK9FgwS1VqasMuegZ/9cgu5OaLVaoz\nCbtrw0rvmRaOsXL0glW8tke4rCeSdjQjOXIfj6Cief1FFjWygEBNjJh5AoGAQ8Ji\nz7T+UMcSN7b3fSkOBFQTST9bM2/yRK8Z4F5UL8nEkryrHIwezBX7gcwY4koq0MMQ\npsAt7l0WioLD/5DCpNqarKoLCXDG3VnpgLoRsvybW4pdsQZi+WvDsIK0efLrwlK9\n9zloT/CZbPYacCu203jHjdvRFtEL2Kow7XdVOl8CgYEAnPwlX4SBFZc7gwWn/15E\npn3Ks3OefMh2ndz0lBlg7YSHypqkMi4Y8gHhnazfHbmlDDvzrUg4eRo4qBkm/+CB\nEMbB1V9bI5fp1/S8Bg+4XTF/7tlCZMKy/xOLdl7CgDE3l7HSzDUGSOsYdtS/R1rh\nySFXxuC0f9GhGGheOFLX874=\n-----END PRIVATE KEY-----\n",
      }),
    },
  };
  return config[env];
};
