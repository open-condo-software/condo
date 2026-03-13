/**
 * @template T
 * @param objs {T[]}
 * @param keys {(keyof T)[]}
 * @returns {T[][]}
 * */
function groupBy (objs, keys) {
    const groups = {}

    for (const obj of objs) {
        const groupKey = keys.map(k => obj[k]).join(':')
        if (!groups[groupKey]) groups[groupKey] = []
        groups[groupKey].push(obj)
    }

    return Object.values(groups)
}

module.exports = {
    groupBy,
}