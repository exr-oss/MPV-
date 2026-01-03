import { getSources } from "./sources.js";
import { fetchAll } from "./fetch.js";
import { decodeAll } from "./decode.js";
import { normalizeAll } from "./normalize.js";
import { applyLimits } from "./limit.js";
import { scoreAll } from "./score.js";
import { saveHistory } from "./history.js";

import { exportJSON } from "./export/json.js";
import { exportTXT } from "./export/main.js";

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        try {
            // ========= ROUTING =========
            if (url.pathname === "/run") {
                return await runPipeline(env);
            }

            if (url.pathname === "/export/json") {
                return await exportJSON(env);
            }

            if (url.pathname === "/export/txt") {
                const raw = await env.STATE.get("LATEST_JSON");
                if (!raw) {
                    return new Response("No data. Run /run first.", { status: 400 });
                }

                const data = JSON.parse(raw);
                const uris = data.map(x => x.raw).filter(Boolean);

                return new Response(exportTXT(uris), {
                    headers: { "content-type": "text/plain; charset=utf-8" }
                });
            }

            return new Response("Not found", { status: 404 });

        } catch (err) {
            return new Response(
                JSON.stringify(
                    {
                        error: err.message,
                        stack: err.stack
                    },
                    null,
                    2
                ),
                { status: 500, headers: { "content-type": "application/json" } }
            );
        }
    }
};

// ========= PIPELINE =========
async function runPipeline(env) {
    const started = Date.now();

    // 1. Sources
    const sources = getSources();
    if (!sources.length) {
        throw new Error("No sources defined");
    }

    // 2. Fetch
    const fetched = await fetchAll(sources);

    // 3. Decode
    const decoded = decodeAll(fetched);

    // 4. Normalize
    const nodes = normalizeAll(decoded);

    // 5. Limits
    const limited = applyLimits(nodes);

    // 6. Score
    const scored = scoreAll(limited);

    // 7. History
    await saveHistory(env, scored);

    // 8. Snapshot for export
    await env.STATE.put("LATEST_JSON", JSON.stringify(scored));

    const finished = Date.now();

    return new Response(
        JSON.stringify(
            {
                ok: true,
                sources: sources.length,
                fetched: fetched.length,
                decoded: decoded.length,
                nodes: nodes.length,
                limited: limited.length,
                scored: scored.length,
                duration_ms: finished - started
            },
            null,
            2
        ),
        { headers: { "content-type": "application/json" } }
    );
}
