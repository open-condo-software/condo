export class LocalStorageManager <T> {
    getItem (key: string): T | null {
        try {
            const item = localStorage.getItem(key)
            return item ? JSON.parse(item) as T : null
        } catch (error) {
            console.error(`Error reading key "${key}" from LocalStorage:`, error)
            return null
        }
    }

    setItem (key: string, value: T): void {
        try {
            localStorage.setItem(key, JSON.stringify(value))
        } catch (error) {
            console.error(`Error writing key "${key}" to LocalStorage:`, error)
        }
    }
}