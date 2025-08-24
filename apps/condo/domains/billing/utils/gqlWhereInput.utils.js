
// This function exists exclusively for allResidentBillingReceipts, as API there requires mix of ServiceConsumer and BillingReceipt filters
// Most probably you don't need this function, and if you need, you did something wrong.
// Most probably you need to group / separate filters in your custom query on API level, instead of trying to aggregate one mixed filter
/** Remove unneeded filter keys from where input */
function removeKeysFromObjectDeep (obj, keysToRemove = []) {
    if (!Array.isArray(keysToRemove)) {
        keysToRemove = [keysToRemove].filter(Boolean)
    }
    if (keysToRemove.length === 0) {
        return obj
    }
    for (const key of Object.keys(obj)) {
        if (keysToRemove.includes(key)) {
            delete obj[key]
            continue
        }
        if (key === 'AND' || key === 'OR') {
            obj[key].forEach(objItem => removeKeysFromObjectDeep(objItem, keysToRemove))
        }
    }
    return obj
}

module.exports = {
    removeKeysFromObjectDeep,
}