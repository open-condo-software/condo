export const getStorage = (key: string): unknown => {
    if (typeof window === 'undefined') return null
    try {
        const saved = localStorage.getItem(key)
        return saved ? JSON.parse(saved) : null
    } catch {
        return null
    }
}

export const saveStorage = (key: string, data: unknown): void => {
    if (typeof window === 'undefined') return
    try {
        localStorage.setItem(key, JSON.stringify(data))
    } catch {
        return
    }
}
