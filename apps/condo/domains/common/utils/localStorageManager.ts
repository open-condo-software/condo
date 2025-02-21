export class LocalStorageManager <ItemType> {
    getItem (key: string): ItemType | null {
        try {
            const item = localStorage.getItem(key)
            return item ? JSON.parse(item) as ItemType : null
        } catch (error) {
            console.error(`Error reading key "${key}" from LocalStorage:` + error)
            return null
        }
    }

    setItem (key: string, value: ItemType): void {
        try {
            localStorage.setItem(key, JSON.stringify(value))
        } catch (error) {
            console.error(`Error writing key "${key}" to LocalStorage:` + error)
        }
    }
}