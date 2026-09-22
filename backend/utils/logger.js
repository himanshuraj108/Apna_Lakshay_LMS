/**
 * Apna Lakshay LMS — Structured Application Logger
 * --------------------------------------------------
 * Production-grade log output: timestamped, level-labeled, ANSI-colored.
 * Compatible with log aggregators (Datadog, Cloudwatch, GCP, Logtail).
 *
 * Format:
 *   [YYYY-MM-DD HH:MM:SS.mmm UTC] [LEVEL] [namespace] message  {meta}
 */

'use strict';

const IS_TTY      = process.stdout.isTTY;
const IS_PROD     = process.env.NODE_ENV === 'production';
const APP_NAME    = 'apna-lakshay-lms';
const VERSION     = process.env.npm_package_version || '1.0.0';

// ── ANSI palette (stripped automatically in non-TTY / CI environments) ──────
const C = IS_TTY ? {
    reset   : '\x1b[0m',
    bold    : '\x1b[1m',
    dim     : '\x1b[2m',
    // foreground
    white   : '\x1b[97m',
    gray    : '\x1b[90m',
    green   : '\x1b[32m',
    cyan    : '\x1b[36m',
    yellow  : '\x1b[33m',
    red     : '\x1b[31m',
    magenta : '\x1b[35m',
    blue    : '\x1b[34m',
    orange  : '\x1b[38;5;208m',
    // background
    bgGreen : '\x1b[42m',
    bgRed   : '\x1b[41m',
    bgBlue  : '\x1b[44m',
} : new Proxy({}, { get: () => '' });

// ── Timestamp ────────────────────────────────────────────────────────────────
const ts = () => {
    const d = new Date();
    return d.toISOString().replace('T', ' ').slice(0, 23) + ' UTC';
};

// ── Level config ─────────────────────────────────────────────────────────────
const LEVELS = {
    debug : { label: 'DEBUG', color: C.gray,    out: process.stdout },
    info  : { label: 'INFO ', color: C.cyan,    out: process.stdout },
    ok    : { label: 'OK   ', color: C.green,   out: process.stdout },
    warn  : { label: 'WARN ', color: C.yellow,  out: process.stderr },
    error : { label: 'ERROR', color: C.red,     out: process.stderr },
    fatal : { label: 'FATAL', color: C.red,     out: process.stderr },
};

// ── Core emit ────────────────────────────────────────────────────────────────
const emit = (level, ns, msg, meta) => {
    const { label, color, out } = LEVELS[level];
    const timestamp = `${C.dim}[${ts()}]${C.reset}`;
    const badge     = `${color}${C.bold}[${label}]${C.reset}`;
    const namespace = `${C.gray}[${ns}]${C.reset}`;
    const message   = `${C.white}${msg}${C.reset}`;
    const extra     = meta
        ? `  ${C.dim}${JSON.stringify(meta)}${C.reset}`
        : '';

    out.write(`${timestamp} ${badge} ${namespace} ${message}${extra}\n`);
};

// ── Public API ───────────────────────────────────────────────────────────────
const createLogger = (namespace = 'app') => ({
    debug : (msg, meta) => { if (!IS_PROD) emit('debug', namespace, msg, meta); },
    info  : (msg, meta) => emit('info',  namespace, msg, meta),
    ok    : (msg, meta) => emit('ok',    namespace, msg, meta),
    warn  : (msg, meta) => emit('warn',  namespace, msg, meta),
    error : (msg, meta) => emit('error', namespace, msg, meta),
    fatal : (msg, meta) => emit('fatal', namespace, msg, meta),
});

// ── Banner — printed once on process boot ─────────────────────────────────
const printBanner = () => {
    const env  = (process.env.NODE_ENV || 'development').toUpperCase();
    const port = process.env.PORT || 5000;
    const line = '─'.repeat(60);

    process.stdout.write('\n');
    process.stdout.write(`${C.orange}${C.bold}  ${line}${C.reset}\n`);
    process.stdout.write(`${C.orange}${C.bold}   APNA LAKSHAY LMS  — Library Management System${C.reset}\n`);
    process.stdout.write(`${C.dim}   v${VERSION}  |  ${APP_NAME}  |  Node ${process.version}${C.reset}\n`);
    process.stdout.write(`${C.orange}${C.bold}  ${line}${C.reset}\n`);
    process.stdout.write('\n');

    const kvLine = (key, val, valColor = C.white) =>
        process.stdout.write(
            `  ${C.dim}${key.padEnd(22)}${C.reset}${valColor}${C.bold}${val}${C.reset}\n`
        );

    kvLine('Environment',   env,                    env === 'PRODUCTION' ? C.green : C.yellow);
    kvLine('Process ID',    String(process.pid));
    kvLine('Port',          String(port));
    kvLine('Platform',      `${process.platform} / ${process.arch}`);
    kvLine('Timezone',      Intl.DateTimeFormat().resolvedOptions().timeZone);
    kvLine('Startup',       new Date().toUTCString());

    process.stdout.write('\n');
    process.stdout.write(`${C.dim}  ${'─'.repeat(60)}${C.reset}\n\n`);
};

// ── Section divider ──────────────────────────────────────────────────────────
const section = (title) => {
    const pad = '─'.repeat(4);
    process.stdout.write(
        `\n${C.dim}  ${pad} ${title.toUpperCase()} ${pad}${C.reset}\n\n`
    );
};

// ── Status row helper (used during boot checklist) ───────────────────────────
const status = (label, value, ok = true) => {
    const icon  = ok ? `${C.green}[  OK  ]${C.reset}` : `${C.red}[ FAIL ]${C.reset}`;
    const lbl   = `${C.gray}${label.padEnd(30)}${C.reset}`;
    const val   = `${C.bold}${value}${C.reset}`;
    process.stdout.write(`  ${icon}  ${lbl} ${val}\n`);
};

module.exports = { createLogger, printBanner, section, status };
