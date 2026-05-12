export const flattenObject = (obj: Record<string, any>, prefix = ''): Record<string, any>=> {
    return Object.keys(obj).reduce((acc, key) => {
        const pre = prefix.length ? prefix + '.' : ''
        const value = obj[key]

        if (Array.isArray(value)) {
            value.forEach(item => {
                acc[`${pre}${key}.${item}`] = 'true'
            })
        } else if (typeof value === 'object' && value !== null) {
            Object.assign(acc, flattenObject(value, pre + key))
        } else {
            acc[pre + key] = value
        }

        return acc
    }, {})
}
