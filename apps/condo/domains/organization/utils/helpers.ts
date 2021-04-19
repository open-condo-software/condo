export function getStorageItem<T> (key: string): T | void {
    try {
        return JSON.parse(localStorage.getItem(key))
    } catch (e) {
        return
    }
}
