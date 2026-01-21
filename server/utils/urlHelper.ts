import { Request } from 'express';

/**
 * Автоматически определяет frontend URL из запроса
 * Использует заголовки origin, referer или host
 */
export function getFrontendUrl(req: Request): string {
    // 1. Приоритет: переменная окружения
    if (process.env.FRONTEND_URL) {
        return process.env.FRONTEND_URL;
    }

    // 2. Для Vercel - автоматическое определение
    if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`;
    }

    // 3. Origin header (самый надёжный)
    const origin = req.get('origin');
    if (origin) {
        return origin;
    }

    // 4. Referer header
    const referer = req.get('referer');
    if (referer) {
        try {
            const url = new URL(referer);
            return `${url.protocol}//${url.host}`;
        } catch (e) {
            // Игнорируем невалидный referer
        }
    }

    // 5. Host header с протоколом
    const host = req.get('host');
    if (host) {
        const protocol = req.secure || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
        return `${protocol}://${host}`;
    }

    // 6. Fallback для разработки
    return 'http://127.0.0.1:8080';
}

/**
 * Проверяет корректность URL
 */
export function isValidUrl(url: string): boolean {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}
