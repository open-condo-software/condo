export function getCurrentPage (queryPage?: string | Array<string>): number {
    if (!queryPage || Array.isArray(queryPage)) {
        return 1
    }
    const page = parseInt(queryPage)
    if (Number.isNaN(page)) {
        return 1
    }

    return Math.max(1, page)
}