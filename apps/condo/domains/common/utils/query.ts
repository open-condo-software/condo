export const getObjectValueFromQuery = (router, path = [], defaultValue = {}) => {
    try {
        const query = path.reduce((acc, key) => acc?.[key], router?.query)
        if (!query) return defaultValue

        return JSON.parse(query)
    } catch (e) {
        console.error(e)
    }

    return defaultValue
}
