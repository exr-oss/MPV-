function isValidURI(url) {
    if (typeof url != "string") return false;
    return (
        url.startsWith("vless://") ||
        url.startsWith("trojan://") ||
        url.startsWith("hysteria2://") ||
        url.startsWith("hy2://") ||
        url.startsWith("ss://") ||
        url.startsWith("tuic://")
    );
}

function dedup(list) {
    const seen = new Set();
    const out = [];
    for (const x of list) {
        if (seen.has(x)) continue;
        seen.add(x);
        out.push(x);
    }
    return out;
}

export function exportTXT(uris) {
    if (!Array.isArray(uris) || uris.length == 0) {
        return "";
    }

    const cleaned = [];
    for (const url of uris) {
        if (!isValidURI(url)) continue;
        cleaned.push(url.trim());
    }

    return dedup(cleaned).join("\n") + "\n";
}
