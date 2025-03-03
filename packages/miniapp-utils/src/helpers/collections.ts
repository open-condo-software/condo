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
