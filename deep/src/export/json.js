import { TIERS } from "../score.js";

/**
 * Формат выходного JSON (строго):
 * {
 *   generated_at: ISO8601,
 *   total: number,
 *   gold: number,
 *   sources: [
 *     {
 *       url,
 *       protocol,
 *       country,
 *       size,
 *       lines,
 *       latency,
 *       score,
 *       tier
 *     }
 *   ]
 * }
 */
export function exportGoldSources(scoredSources) {
    const gold = scoredSources.filter(
        s => s.score && s.score.tier === TIERS.GOLD
    );

    const payload = {
        generated_at: new Date().toISOString(),
        total: scoredSources.length,
        gold: gold.length,
        sources: gold.map(s => ({
            url: s.url,
            protocol: s.protocol ?? "mixed",
            country: s.country ?? "unknown",
            size: s.score.size,
            lines: s.score.lines,
            latency: s.score.latency,
            score: s.score.score,
            tier: s.score.tier
        }))
    };

    return new Response(JSON.stringify(payload, null, 2), {
        headers: {
            "content-type": "application/json; charset=utf-8",
            "cache-control": "no-store"
        }
    });
}
