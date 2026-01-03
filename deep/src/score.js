function detectProto(uri) {
    if (uri.startsWith("vless://")) return "vless";
    if (uri.startsWith("trojan://")) return "trojan";
    if (uri.startsWith("hysteria2://")) return "hysteria2";
    if (uri.startsWith("hy2://")) return "hy2";
    if (uri.startsWith("ss://")) return "ss";
    if (uri.startsWith("tuic://")) return "tuic";
    return "other";
}

// простая модель приоритета протоколов
const PROTO_WEIGHT = {
    vless: 100,
    trojan: 90,
    hysteria2: 85,
    hy2: 85,
    ss: 70,
    tuic: 60,
    other: 10
};

export function scoreURIs(uris) {
    if (!Array.isArray(uris)) return [];
    
    const scored = [];
    for (const uri of uris) {
        if (typeof uri !== "string") continue;
        const proto = detectProto(uri);
        const weight = PROTO_WEIGHT[proto] || 0;
        
        scored.push({
            uri,
            proto,
            score: weight
        });
    }
    
    // сортировка - ТОЛЬКО внутри массива
    scored.sort((a, b) => b.score - a.score);
    
    // ВАЖНО: возвращаем ТОЛЬКО uri
    return scored.map(x => x.uri);
}
