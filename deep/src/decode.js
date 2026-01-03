export function decodeBase64(input) {
    try {
        // Убираем пробелы и переносы
        const clean = input.replace(/\s+/g, '');
        // Декодируем base64
        return atob(clean);
    } catch {
        return '';
    }
}

export function decodeAll(fetched) {
    // fetched — массив объектов из fetchSources: { url, ok, size, raw, ... }
    const decoded = [];

    for (const item of fetched) {
        if (!item.ok || !item.raw) {
            decoded.push({
                ...item,
                decoded: [],
                lines: []
            });
            continue;
        }

        try {
            // Пробуем декодировать base64
            let content = item.raw;
            
            // Если текст выглядит как base64 (нет протоколов, но есть = в конце)
            if (!content.includes('://') && /^[A-Za-z0-9+/=]+$/.test(content.trim())) {
                content = decodeBase64(content);
            }

            // Разбиваем на строки
            const lines = content.split('\n')
                .map(line => line.trim())
                .filter(line => line && line.length > 5);

            decoded.push({
                ...item,
                decoded: lines,
                lines: lines
            });
        } catch (err) {
            decoded.push({
                ...item,
                decoded: [],
                lines: [],
                error: err.message
            });
        }
    }

    return decoded;
}
