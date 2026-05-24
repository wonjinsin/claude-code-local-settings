#!/usr/bin/env node
'use strict';

// Pure Claude Code status line. Replaces ccstatusline.
// One file. Node built-ins only. Two modes:
//   node statusline.js              read stdin JSON, render 3 lines, optionally fork --refresh
//   node statusline.js --refresh    call Anthropic /api/oauth/usage, write cache, exit

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const https = require('node:https');
const { execFileSync, spawn } = require('node:child_process');

const CACHE_DIR = path.join(os.homedir(), '.cache', 'claude-statusline');
const CACHE_FILE = path.join(CACHE_DIR, 'usage.json');
const LOCK_FILE = path.join(CACHE_DIR, 'usage.lock');
const CACHE_TTL_S = 180;
const LOCK_TTL_S = 30;
const DEFAULT_BACKOFF_S = 300;
const API_TIMEOUT_MS = 5000;
const CONTEXT_WINDOW = 1_000_000; // 1M ctx beta enabled in settings
const KEYCHAIN_SERVICE = 'Claude Code-credentials';
const USAGE_URL = 'https://api.anthropic.com/api/oauth/usage';

// Dracula palette, bold
const C = {
    purple: '\x1b[1;38;2;189;147;249m',
    cyan:   '\x1b[1;38;2;139;233;253m',
    fg:     '\x1b[1;38;2;248;248;242m',
    pink:   '\x1b[1;38;2;255;121;198m',
    orange: '\x1b[1;38;2;255;184;108m',
    green:  '\x1b[1;38;2;80;250;123m',
    dim:    '\x1b[1;38;2;98;114;164m',
    reset:  '\x1b[0m',
};

function paint(s, c) { return `${c}${s}${C.reset}`; }

if (process.argv.includes('--refresh')) {
    refreshUsage().catch(() => {}).finally(() => process.exit(0));
} else {
    main().catch(() => process.exit(0));
}

async function main() {
    const stdin = await readStdin();
    let input = {};
    try { input = JSON.parse(stdin); } catch { /* tolerate empty stdin during dev */ }

    const cwd = input.workspace?.current_dir || input.cwd || process.cwd();
    const modelName = input.model?.display_name || input.model?.id || 'Claude';
    const transcriptPath = input.transcript_path || '';

    const dir = path.basename(cwd) || cwd;
    const branch = gitBranch(cwd);
    const changes = gitChanges(cwd);
    const tokens = getTokenMetrics(transcriptPath);
    const usage = readUsageCache();

    const sep = paint(' | ', C.fg);

    const line1Parts = [paint(dir, C.purple)];
    if (branch) line1Parts.push(paint(` ${branch}`, C.cyan));
    line1Parts.push(paint(`(+${changes.ins},-${changes.del})`, C.fg));

    const line2Parts = [
        paint(`Model: ${modelName}`, C.pink),
        paint(`Ctx Used: ${formatPct(tokens.ctxPct)}`, C.purple),
        paint(`Session: ${formatPct(usage.sessionUsage)}`, C.cyan),
        paint(`Weekly: ${formatPct(usage.weeklyUsage)}`, C.cyan),
    ];

    const line3Parts = [
        paint(`In: ${fmtTok(tokens.inputTokens)}`, C.orange),
        paint(`Out: ${fmtTok(tokens.outputTokens)}`, C.orange),
        paint(`Cached: ${fmtTok(tokens.cachedTokens)}`, C.green),
        paint(`Total: ${fmtTok(tokens.totalTokens)}`, C.purple),
    ];

    process.stdout.write(
        line1Parts.join(sep) + '\n' +
        line2Parts.join(sep) + '\n' +
        line3Parts.join(sep)
    );

    maybeTriggerRefresh();
}

// ---------- stdin ----------
function readStdin() {
    return new Promise((resolve) => {
        if (process.stdin.isTTY) return resolve('');
        let buf = '';
        process.stdin.setEncoding('utf8');
        process.stdin.on('data', (c) => { buf += c; });
        process.stdin.on('end', () => resolve(buf));
        process.stdin.on('error', () => resolve(buf));
        // safety: if no data within 200ms, resolve empty
        setTimeout(() => resolve(buf), 200).unref();
    });
}

// ---------- git ----------
function gitBranch(cwd) {
    try {
        return execFileSync('git', ['-C', cwd, 'symbolic-ref', '--quiet', '--short', 'HEAD'],
            { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    } catch {
        try {
            return execFileSync('git', ['-C', cwd, 'rev-parse', '--short', 'HEAD'],
                { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
        } catch { return ''; }
    }
}

function gitChanges(cwd) {
    let ins = 0, del = 0;
    for (const args of [['-C', cwd, 'diff', '--numstat'], ['-C', cwd, 'diff', '--cached', '--numstat']]) {
        try {
            const out = execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
            for (const line of out.split('\n')) {
                const m = line.match(/^(\d+|-)\s+(\d+|-)\s+/);
                if (!m) continue;
                if (m[1] !== '-') ins += parseInt(m[1], 10);
                if (m[2] !== '-') del += parseInt(m[2], 10);
            }
        } catch { /* not a repo or git missing */ }
    }
    return { ins, del };
}

// ---------- transcript JSONL token metrics ----------
function getTokenMetrics(transcriptPath) {
    const empty = { inputTokens: 0, outputTokens: 0, cachedTokens: 0, totalTokens: 0, ctxPct: null };
    if (!transcriptPath) return empty;
    let raw;
    try { raw = fs.readFileSync(transcriptPath, 'utf8'); } catch { return empty; }

    const entries = [];
    let hasStopReason = false;
    for (const line of raw.split('\n')) {
        if (!line) continue;
        let obj;
        try { obj = JSON.parse(line); } catch { continue; }
        if (!obj?.message?.usage) continue;
        if (Object.prototype.hasOwnProperty.call(obj.message, 'stop_reason')) hasStopReason = true;
        entries.push(obj);
    }

    // Streaming-aware: count finalized entries + the last in-flight one only
    const counted = hasStopReason
        ? entries.filter((e, i) => Boolean(e.message.stop_reason) || (e.message.stop_reason === null && i === entries.length - 1))
        : entries;

    let inputTokens = 0, outputTokens = 0, cachedTokens = 0;
    let mostRecent = null, mostRecentTs = 0;
    for (const e of counted) {
        const u = e.message.usage;
        inputTokens += u.input_tokens || 0;
        outputTokens += u.output_tokens || 0;
        cachedTokens += (u.cache_read_input_tokens || 0) + (u.cache_creation_input_tokens || 0);
        if (e.isSidechain !== true && e.timestamp && !e.isApiErrorMessage) {
            const ts = Date.parse(e.timestamp);
            if (ts > mostRecentTs) { mostRecentTs = ts; mostRecent = e; }
        }
    }

    let ctxPct = null;
    if (mostRecent?.message?.usage) {
        const u = mostRecent.message.usage;
        const ctx = (u.input_tokens || 0) + (u.cache_read_input_tokens || 0) + (u.cache_creation_input_tokens || 0);
        ctxPct = (ctx / CONTEXT_WINDOW) * 100;
    }

    return { inputTokens, outputTokens, cachedTokens, totalTokens: inputTokens + outputTokens + cachedTokens, ctxPct };
}

// ---------- formatting ----------
function fmtTok(n) {
    if (n == null) return '-';
    if (n < 1000) return String(n);
    if (n < 1_000_000) return (n / 1000).toFixed(1) + 'k';
    return (n / 1_000_000).toFixed(2) + 'M';
}

function formatPct(p) {
    if (p == null || Number.isNaN(p)) return '-%';
    return p.toFixed(1) + '%';
}

// ---------- usage cache (Session / Weekly) ----------
function readUsageCache() {
    try {
        const obj = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
        return {
            sessionUsage: typeof obj.sessionUsage === 'number' ? obj.sessionUsage : null,
            weeklyUsage:  typeof obj.weeklyUsage  === 'number' ? obj.weeklyUsage  : null,
            fetchedAt: obj.fetchedAt || 0,
            error: obj.error || null,
        };
    } catch {
        return { sessionUsage: null, weeklyUsage: null, fetchedAt: 0, error: null };
    }
}

function cacheAgeSeconds() {
    try {
        const stat = fs.statSync(CACHE_FILE);
        return Math.floor((Date.now() - stat.mtimeMs) / 1000);
    } catch { return Infinity; }
}

function activeLock() {
    try {
        const obj = JSON.parse(fs.readFileSync(LOCK_FILE, 'utf8'));
        if (typeof obj.blockedUntil === 'number' && obj.blockedUntil * 1000 > Date.now()) return obj;
    } catch { /* no lock or stale */ }
    return null;
}

function writeLock(blockedUntilSec, error) {
    try {
        ensureCacheDir();
        fs.writeFileSync(LOCK_FILE, JSON.stringify({ blockedUntil: blockedUntilSec, error }));
    } catch { /* ignore */ }
}

function clearLock() {
    try { fs.unlinkSync(LOCK_FILE); } catch { /* ignore */ }
}

function ensureCacheDir() {
    if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
}

function maybeTriggerRefresh() {
    if (cacheAgeSeconds() < CACHE_TTL_S) return;
    if (activeLock()) return;
    try {
        const child = spawn(process.execPath, [__filename, '--refresh'], {
            detached: true,
            stdio: 'ignore',
            windowsHide: true,
        });
        child.unref();
    } catch { /* swallow */ }
}

// ---------- --refresh mode ----------
async function refreshUsage() {
    ensureCacheDir();
    // brief lock so concurrent refreshes don't stampede
    writeLock(Math.floor(Date.now() / 1000) + LOCK_TTL_S, null);

    const token = readOAuthToken();
    if (!token) {
        writeCache({ error: 'no-token' });
        clearLock();
        return;
    }

    const result = await httpGetJson(USAGE_URL, {
        Authorization: `Bearer ${token}`,
        'anthropic-beta': 'oauth-2025-04-20',
    }, API_TIMEOUT_MS);

    if (result.status === 429) {
        const retry = parseInt(result.headers['retry-after'] || '', 10);
        const backoff = Number.isFinite(retry) && retry > 0 ? retry : DEFAULT_BACKOFF_S;
        writeLock(Math.floor(Date.now() / 1000) + backoff, 'rate-limited');
        // keep stale cache intact
        return;
    }

    if (result.status !== 200 || !result.body) {
        // keep prior cache; just clear our own short lock
        clearLock();
        return;
    }

    const data = result.body;
    writeCache({
        sessionUsage: data.five_hour?.utilization ?? null,
        sessionResetAt: data.five_hour?.resets_at ?? null,
        weeklyUsage: data.seven_day?.utilization ?? null,
        weeklyResetAt: data.seven_day?.resets_at ?? null,
        weeklySonnetUsage: data.seven_day_sonnet?.utilization ?? null,
        weeklyOpusUsage: data.seven_day_opus?.utilization ?? null,
    });
    clearLock();
}

function writeCache(extra) {
    const payload = JSON.stringify({ fetchedAt: Math.floor(Date.now() / 1000), ...extra });
    const tmp = CACHE_FILE + '.tmp';
    try {
        fs.writeFileSync(tmp, payload);
        fs.renameSync(tmp, CACHE_FILE);
    } catch { /* ignore */ }
}

function readOAuthToken() {
    // macOS: try keychain primary entry first, then ~/.claude/.credentials.json
    if (process.platform === 'darwin') {
        const secret = readKeychainSecret(KEYCHAIN_SERVICE);
        const t = extractToken(secret);
        if (t) return t;
    }
    try {
        const credPath = path.join(os.homedir(), '.claude', '.credentials.json');
        return extractToken(fs.readFileSync(credPath, 'utf8'));
    } catch { return null; }
}

function readKeychainSecret(service) {
    try {
        return execFileSync('security', ['find-generic-password', '-s', service, '-w'],
            { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    } catch { return null; }
}

function extractToken(raw) {
    if (!raw) return null;
    try {
        const obj = JSON.parse(raw);
        return obj?.claudeAiOauth?.accessToken || null;
    } catch { return null; }
}

function httpGetJson(url, headers, timeoutMs) {
    return new Promise((resolve) => {
        let settled = false;
        const done = (v) => { if (!settled) { settled = true; resolve(v); } };
        let req;
        try {
            req = https.request(url, { method: 'GET', headers, timeout: timeoutMs }, (res) => {
                let body = '';
                res.setEncoding('utf8');
                res.on('data', (c) => { body += c; });
                res.on('end', () => {
                    let parsed = null;
                    try { parsed = JSON.parse(body); } catch { /* may be empty */ }
                    done({ status: res.statusCode || 0, headers: res.headers, body: parsed });
                });
            });
        } catch {
            done({ status: 0, headers: {}, body: null });
            return;
        }
        req.on('error', () => done({ status: 0, headers: {}, body: null }));
        req.on('timeout', () => { try { req.destroy(); } catch {}; done({ status: 0, headers: {}, body: null }); });
        req.end();
    });
}
