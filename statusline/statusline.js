#!/usr/bin/env node
'use strict';

// Pure Claude Code status line. Reads stdin JSON, renders 3 lines.
// All metrics come from stdin — no external API calls, no cache, no OAuth.
//   Session / Weekly: stdin rate_limits.{five_hour,seven_day}.used_percentage
//   Ctx % + token breakdown: parsed from transcript JSONL (stdin lacks
//   cumulative cached/total tokens).

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const CONTEXT_WINDOW = 1_000_000; // 1M ctx beta enabled in settings

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

main().catch(() => process.exit(0));

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

    const rl = input.rate_limits || {};
    const sessionUsage = rl.five_hour?.used_percentage ?? null;
    const weeklyUsage = rl.seven_day?.used_percentage ?? null;

    const sep = paint(' | ', C.fg);

    const line1Parts = [paint(dir, C.purple)];
    if (branch) line1Parts.push(paint(` ${branch}`, C.cyan));
    line1Parts.push(paint(`(+${changes.ins},-${changes.del})`, C.fg));

    const line2Parts = [
        paint(`Model: ${modelName}`, C.pink),
        paint(`Ctx Used: ${formatPct(tokens.ctxPct)}`, C.purple),
        paint(`Session: ${formatPct(sessionUsage)}`, C.cyan),
        paint(`Weekly: ${formatPct(weeklyUsage)}`, C.cyan),
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
