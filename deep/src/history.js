// src/history.js
// STEP 26 -- SOURCE HISTORY (KV)
// Назначение:
// - хранить историю источников
// - давать бонус стабильным
// - штрафовать флаппинг / деградацию
// KV namespace: SOURCES_KV
// Ключ: source:<hash(url)> 

const HISTORY_DAYS = 7;
const MAX_ENTRIES = 30;

function hashUrl(url) {
    return crypto.subtle.digest("SHA-1", new TextEncoder().encode(url))
        .then(buf =>
            Array.from(new Uint8Array(buf))
                .map(b => b.toString(16).padStart(2, "0"))
                .join("")
        );
}

export async function loadHistory(env, url) {
    const key = "source:" + await hashUrl(url);
    const raw = await env.SOURCES_KV.get(key);
    return raw ? JSON.parse(raw) : [];
}

export async function saveHistory(env, url, entry) {
    const key = "source:" + await hashUrl(url);
    const history = await loadHistory(env, url);

    history.push({
        ts: Date.now(),
        ok: entry.ok,
        latency: entry.latency,
        size: entry.size,
        lines: entry.lines
    });

    // ограничиваем размер
    const trimmed = history.slice(-MAX_ENTRIES);

    await env.SOURCES_KV.put(key, JSON.stringify(trimmed));
}

/**
 * Рассчёт коэффициента стабильности
 * 1.00 - идеально
 * <0.85 - нестабильный источник
 */
export function stabilityFactor(history) {
    if (!history.length) return 1.0;

    const recent = history.filter(
        h => Date.now() - h.ts < HISTORY_DAYS * 86400_000
    );

    if (!recent.length) return 1.0;

    const okRate = recent.filter(h => h.ok).length / recent.length;

    let factor = okRate;

    // штраф за рост latency
    const latencies = recent.map(h => h.latency).filter(Boolean);
    if (latencies.length >= 3) {
        const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
        const last = latencies.at(-1);

        if (last > avg * 1.5) factor -= 0.1;
    }

    return Math.max(0.6, Math.min(1.1, factor));
}
