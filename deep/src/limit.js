// src/limit.js
// STEP 22 -- HARD LIMITS

const MAX_TOTAL = 800;

const MAX_BY_PROTO = {
    vless: 300,
    trojan: 200,
    hysteria2: 120,
    hy2: 120,
    ss: 100,
    tuic: 60
};

function detectProto(url) {
    if (url.startsWith("vless://")) return "vless";
    if (url.startsWith("trojan://")) return "trojan";
    if (url.startsWith("hysteria2://")) return "hysteria2";
    if (url.startsWith("hy2://")) return "hy2";
    if (url.startsWith("ss://")) return "ss";
    if (url.startsWith("tuic://")) return "tuic";
    return null;
}

export function applyLimits(uris) {
    const out = [];
    const total = { all: 0 };
    const protoCount = {};

    for (const url of uris) {
        if (total.all >= MAX_TOTAL) break;
        const proto = detectProto(url);
        if (!proto) continue;

        protoCount[proto] ||= 0;
        const maxProto = MAX_BY_PROTO[proto] || 0;
        if (protoCount[proto] >= maxProto) continue;

        out.push(url);
        protoCount[proto]++;
        total.all++;
    }
    return out;
}
