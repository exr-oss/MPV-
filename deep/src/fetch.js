// src/fetch.js
// SAFE FETCH - timeout + size + line limits
// STEP 23 (LOCKED)

const TIMEOUT_MS = 5000;    // жёсткий таймаут
const MAX_BYTES = 1_500_000;    // ~1.5 MB
const MAX_LINES = 3000;    // защита от огромных файлов

/**
 * Безопасная загрузка текста из источника
 * - fail-fast
 * - не вешает worker
 * - режет большие файлы
 */
export async function safeFetchText(url) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
        const res = await fetch(url, {
            signal: controller.signal,
            cf: {
                cacheTtl: 300,    // короткий кэш
                cacheEverything: true
            }
        });

        if (!res.ok) {
            return "";
        }

        if (!res.body) {
            return "";
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        let result = "";
        let totalBytes = 0;
        let totalLines = 0;

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            totalBytes += value.byteLength;
            if (totalBytes > MAX_BYTES) break;

            const chunk = decoder.decode(value, { stream: true });
            result += chunk;

            const newLines = chunk.match(/\n/g);
            if (newLines) {
                totalLines += newLines.length;
                if (totalLines > MAX_LINES) break;
            }
        }

        return result;
    } catch (err) {
        // timeout / abort / network error
        return "";
    } finally {
        clearTimeout(timeout);
    }
}

/**
 * Утилита для массовой загрузки sources
 * Используется в index.js
 */
export async function fetchSources(sources) {
    const out = [];
    for (const src of sources) {
        const raw = await safeFetchText(src.url);

        out.push({
            ...src,
            ok: Boolean(raw),
            size: raw.length,
            raw
        });
    }
    return out;
}
