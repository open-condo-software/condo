export function isValidPreferences (obj: unknown): obj is Record<string, string | boolean> {
    return obj !== null && typeof obj === 'object' && Object.values(obj).every(v => typeof v === 'string' || typeof v === 'boolean')
}