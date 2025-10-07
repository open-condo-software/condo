/**
 * Checks whenever values is NonNullable.
 * From es5 docs NonNullable excludes null and undefined from T
 * @example
 * const collection: Array<number | null | undefined> = [1, null, 3, undefined, 5]
 * const filtered = collection.filter(nonNull) // Array<number>, so it's safe to process it
 */
export function nonNull<TVal> (val: TVal): val is NonNullable<TVal> {
    return val !== null && val !== undefined
}

/**
 * Removes keys from object
 * @example
 * const obj = { a: 1, b: 2, c: 3 }
 * const newObj = omit(obj, ['a', 'b']) // { c: 3 }
 * const newObj2 = omit(obj, 'c') // { a: 1, b: 2 }
 */
export function omit<TObj extends Record<string, unknown>, TKey extends keyof TObj> (obj: TObj, keys: TKey | Array<TKey>): Omit<TObj, TKey> {
    const newObj: Omit<TObj, TKey> = { ...obj }
    const keysToRemove = Array.isArray(keys) ? keys : [keys]
    keysToRemove.forEach((key) => {
        if (Reflect.has(newObj, key)) {
            Reflect.deleteProperty(newObj, key)
        }
    })
    return newObj
}
