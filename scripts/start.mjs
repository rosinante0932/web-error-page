#!/usr/bin/env node
import { spawn } from 'node:child_process';
import process from 'node:process';

/* ---------------- env ---------------- */

const rawEnv = (process.env.APP_ENV || process.env.NODE_ENV || 'test')
    .toLowerCase();

const APP_ENV = rawEnv;

let MAX_OLD_MB = process.env.MAX_OLD_MB
    ? Number(process.env.MAX_OLD_MB)
    : undefined;

function pickOldMb(env) {
    switch (env) {
        case 'prod':
        case 'production':
            return 6144;

        case 'staging':
        case 'pre':
        case 'preprod':
        case 'uat':
        case 'sit':
        case 'rc':
            return 1024;

        case 'test':
        case 'testing':
        case 'dev':
        case 'development':
        case 'local':
            return 1024;

        default:
            return 1024;
    }
}

if (!MAX_OLD_MB || Number.isNaN(MAX_OLD_MB)) {
    MAX_OLD_MB = pickOldMb(APP_ENV);
}

const ENTRY = process.env.ENTRY || './dist/server/entry.mjs';

/* ---------------- log ---------------- */

function log(msg) {
    const ts = new Date().toISOString().replace('T', ' ').slice(0, 19);
    process.stdout.write(`[${ts}] ${msg}\n`);
}

/* ---------------- info ---------------- */

log(`start env=${APP_ENV}`);
log(`max_old_space_size=${MAX_OLD_MB}MB`);
log(`node=${process.version} pid=${process.pid}`);
log(`entry=${ENTRY}`);

/* ---------------- exec node ---------------- */

const nodeArgs = [
    `--max-old-space-size=${MAX_OLD_MB}`,
    '--expose-gc',
    '--abort-on-uncaught-exception',
    '--trace-warnings',
    ENTRY,
];

const child = spawn(process.execPath, nodeArgs, {
    stdio: 'inherit',
    env: process.env,
});

/* 让信号正确传递（非常重要，Docker / K8s / PM2） */
const forward = (signal) => {
    if (child.pid) {
        child.kill(signal);
    }
};

process.on('SIGTERM', forward);
process.on('SIGINT', forward);
process.on('SIGQUIT', forward);

child.on('exit', (code, signal) => {
    if (signal) {
        log(`child exited by signal ${signal}`);
        process.kill(process.pid, signal);
    } else {
        log(`child exited with code ${code}`);
        process.exit(code ?? 0);
    }
});
