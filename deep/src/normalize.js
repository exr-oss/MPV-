function isValidURI(url) {
    if (typeof url !== "string") return false;
    const s = url.trim();
    if (!s) return false;

    return (
        s.startsWith("vless://") ||
        s.startsWith("trojan://") ||
        s.startsWith("hysteria2://") ||
        s.startsWith("hy2://") ||
        s.startsWith("ss://") ||
        s.startsWith("tuic://")
    );
}

export function normalizeURIs(input) {
    if (!Array.isArray(input)) return [];

    const out = [];
    const seen = new Set();

    for (const raw of input) {
        if (typeof raw !== "string") continue;

        const url = raw.trim();
        if (!isValidURI(url)) continue;

        // dedup by full url
        if (seen.has(url)) continue;
        seen.add(url);

        out.push(url);
    }

    return out;
}
