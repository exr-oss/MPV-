// src/collect.js
// STEP 21 - MERGE + DEDUP + TIER WEIGHT

const TIER_WEIGHT = {
    T1: 100,
    T2: 50,
    T3: 10
};

export function collectAndScore(results) {
    // results = [{ ok, tier, lines[] }, ...]

    const map = new Map();
    const order = [];
    for (const src of results) {
        if (!src.ok) continue;
        if (!TIER_WEIGHT[src.tier]) continue;

        const weight = TIER_WEIGHT[src.tier];

        for (const url of src.lines) {
            if (!url || typeof url !== "string") continue;

            if (!map.has(url)) {
                map.set(url, weight);
                order.push(url);
            } else {
                // если нашли в более высоком tier – повышаем вес
                const prev = map.get(url);
                if (weight > prev) {
                    map.set(url, weight);
                }
            }
        }
    }

    // сортировка по весу, сохраняя стабильность
    order.sort((a, b) => {
        return map.get(b) - map.get(a);
    });

    return order;
}
