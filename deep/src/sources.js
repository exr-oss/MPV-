export function getSources() {
    return [
        // ==========================
        // CORE -- highest priority
        // ==========================
        {
            name: "FOrc3Run Best Results",
            url: "https://raw.githubusercontent.com/FOrc3Run/TelegramV2rayCollector/main/sub/vless",
            tier: "CORE",
            maxlines: 1000,
            timeoutMs: 8000,
            required: true
        },
        // --- protocol split ---
        {
            name: "FOrc3Run vless",
            url: "https://raw.githubusercontent.com/FOrc3Run/TelegramV2rayCollector/main/sub/vless",
            tier: "CORE",
            maxlines: 600,
            timeoutMs: 8000,
            required: true
        },
        {
            name: "FOrc3Run trojan",
            url: "https://raw.githubusercontent.com/FOrc3Run/TelegramV2rayCollector/main/sub/trojan",
            tier: "CORE",
            maxlines: 600,
            timeoutMs: 8000,
            required: true
        },
        {
            name: "FOrc3Run shadowsocks",
            url: "https://raw.githubusercontent.com/FOrc3Run/TelegramV2rayCollector/main/sub/ss",
            tier: "CORE",
            maxlines: 500,
            timeoutMs: 8000,
            required: true
        },
        // --- country split ---
        {
            name: "FOrc3Run Finland",
            url: "https://raw.githubusercontent.com/FOrc3Run/TelegramV2rayCollector/main/sub/finland",
            tier: "CORE",
            maxlines: 300,
            timeoutMs: 8000,
            required: true
        },
        {
            name: "Forc3Run Russia",
            url: "https://raw.githubusercontent.com/Forc3Run/TelegramV2rayCollector/main/sub/russia",
            tier: "CORE",
            maxlines: 300,
            timeoutMs: 8000,
            required: true
        },
        {
            name: "Forc3Run Germany",
            url: "https://raw.githubusercontent.com/Forc3Run/TelegramV2rayCollector/main/sub/germany",
            tier: "CORE",
            maxlines: 300,
            timeoutMs: 8000,
            required: false // optional, may be empty
        },
        // ==========================
        // STABLE - trusted aggregators
        // ==========================
        ...Array.from({ length: 14 }, (_, i) => ({ 
            name: `Epodonios Sub${i + 1}`, 
            url: `https://raw.githubusercontent.com/Epodonios/Sub/main/sub${i + 1}.txt`,
            tier: "STABLE",
            maxlines: 400,
            timeoutMs: 9000,
            required: false
        })),
        {
            name: "Epodonios vless",
            url: "https://raw.githubusercontent.com/Epodonios/Sub/main/vless.txt",
            tier: "STABLE",
            maxlines: 500,
            timeoutMs: 9000,
            required: false
        },
        {
            name: "Epodonios trojan",
            url: "https://raw.githubusercontent.com/Epodonios/Sub/main/trojan.txt",
            tier: "STABLE",
            maxlines: 500,
            timeoutMs: 9000,
            required: false
        },
        {
            name: "Epodonios ss",
            url: "https://raw.githubusercontent.com/Epodonios/Sub/main/ss.txt",
            tier: "STABLE",
            maxlines: 400,
            timeoutMs: 9000,
            required: false
        },
        // ============
        // SPECIAL -- Reality / RU
        // ============
        {
            name: "Igareck BLACK VLESS",
            url: "https://raw.githubusercontent.com/igareck/vless/main/black.txt",
            tier: "SPECIAL",
            maxlines: 250,
            timeoutMs: 7000,
            required: false
        },
        {
            name: "Igareck BLACK SS",
            url: "https://raw.githubusercontent.com/igareck/vless/main/black-ss.txt",
            tier: "SPECIAL",
            maxlines: 250,
            timeoutMs: 7000,
            required: false
        },
        {
            name: "Igareck Reality Mobile",
            url: "https://raw.githubusercontent.com/igareck/vless/main/reality-mobile.txt",
            tier: "SPECIAL",
            maxlines: 200,
            timeoutMs: 7000,
            required: false
        },
        {
            name: "Igareck Reality Cable",
            url: "https://raw.githubusercontent.com/igareck/vless/main/reality-cable.txt",
            tier: "SPECIAL",
            maxlines: 200,
            timeoutMs: 7000,
            required: false
        },
        // ---
        // RAM - noisy, limited
        // ---
        {
            name: "zengfr vless",
            url: "https://raw.githubusercontent.com/zengfr/fr/vless.txt",
            tier: "RAM",
            maxlines: 200,
            timeoutMs: 6000,
            required: false
        },
        {
            name: "zengfr trojan",
            url: "https://raw.githubusercontent.com/zengfr/fr/trojan.txt",
            tier: "RAM",
            maxlines: 200,
            timeoutMs: 6000,
            required: false
        },
        {
            name: "zengfr shadowsocks",
            url: "https://raw.githubusercontent.com/zengfr/fr/ss.txt",
            tier: "RAM",
            maxlines: 200,
            timeoutMs: 6000,
            required: false
        },
        // ---
        // OPTIONAL - lowest weight
        // ---
        {
            name: "gfpcom vless",
            url: "https://raw.githubusercontent.com/wiki/gfpc/vless.txt",
            tier: "OPTIONAL",
            maxlines: 150,
            timeoutMs: 5000,
            required: false
        },
        {
            name: "gfpcom trojan",
            url: "https://raw.githubusercontent.com/wiki/gfpc/trojan.txt",
            tier: "OPTIONAL",
            maxlines: 150,
            timeoutMs: 5000,
            required: false
        }
    ];
}
