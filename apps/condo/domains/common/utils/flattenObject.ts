/**
 * Flattens a nested object into a single-level object using dot notation for keys.
 * * Note: Arrays are flattened by appending each element to the key path and setting the value to 'true'.
 *
 * @param {Record<string, unknown>} obj - The object to flatten.
 * @param {string} [prefix=''] - The key prefix for recursion (internal use).
 * @returns {Record<string, unknown>} A flattened object with dot-notated keys.
 *
 * @example
 * const input = {
 * user: {
 * name: 'John',
 * roles: ['admin', 'editor']
 * },
 * active: true
 * };
 * * const result = flattenObject(input);
 * // {
 * //'user.name': 'John',
 * //'user.roles.admin': 'true',
 * //'user.roles.editor': 'true',
 * //'active': true
 * // }
 */
export const flattenObject = (
    obj: Record<string, unknown>, prefix = ''
): Record<string, unknown> => {
    return Object.keys(obj).reduce((acc, key) => {
        const pre = prefix.length ? `${prefix}.` : ''
        const value = obj[key]

        if (Array.isArray(value)) {
            value.forEach(item => {
                acc[`${pre}${key}.${item}`] = 'true'
            })
        } else if (typeof value === 'object' && value !== null) {
            Object.assign(acc, flattenObject(value as Record<string, unknown>, pre + key))
        } else {
            acc[pre + key] = value
        }

        return acc
    }, {})
}
