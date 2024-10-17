const { v4: uuid } = require('uuid')

const { canonicalizeJSON, loadReceiptsFromCache, saveReceiptsToCache } = require('./utils')

describe('canonicalizeJSON', () => {

    test('should handle primitive types correctly', () => {
        expect(canonicalizeJSON(123)).toBe('123')
        expect(canonicalizeJSON('test')).toBe('"test"')
        expect(canonicalizeJSON(true)).toBe('true')
        expect(canonicalizeJSON(null)).toBe('null')
        expect(canonicalizeJSON(undefined)).toBeUndefined()
    })

    test('should handle empty objects and arrays', () => {
        expect(canonicalizeJSON({})).toBe('{}')
        expect(canonicalizeJSON([])).toBe('[]')
    })

    test('should handle arrays of primitive types', () => {
        expect(canonicalizeJSON([1, 2, 3])).toBe('[1,2,3]')
        expect(canonicalizeJSON(['a', 'b', 'c'])).toBe('["a","b","c"]')
    })

    test('should handle arrays of objects', () => {
        const array = [{ b: 2, a: 1 }, { d: 4, c: 3 }]
        expect(canonicalizeJSON(array)).toBe('[{"a":1,"b":2},{"c":3,"d":4}]')
    })

    test('should handle objects with sorted keys', () => {
        const obj = { b: 2, a: 1, c: 3 }
        expect(canonicalizeJSON(obj)).toBe('{"a":1,"b":2,"c":3}')
    })

    test('should handle nested objects', () => {
        const obj = { z: { b: 2, a: 1 }, x: 3 }
        expect(canonicalizeJSON(obj)).toBe('{"x":3,"z":{"a":1,"b":2}}')
    })

    test('should handle mixed structures', () => {
        const mixed = { a: [1, { b: 2, a: 1 }], c: 3 }
        expect(canonicalizeJSON(mixed)).toBe('{"a":[1,{"a":1,"b":2}],"c":3}')
    })

    test('should handle objects with null values', () => {
        const obj = { a: null, b: 1 }
        expect(canonicalizeJSON(obj)).toBe('{"a":null,"b":1}')
    })

})


describe('Redis receipts cache', () => {
    
    it('should return cached receipts if the receipt has not been modified', async () => {
        const contextId = uuid()
        const receiptId = uuid()
        const importId = uuid()
        await saveReceiptsToCache(contextId, [{ id: receiptId, importId, data: 'some-data' }])
        const cachedValue = await loadReceiptsFromCache(contextId, { 1: { importId, data: 'some-data' } })
        expect(cachedValue).toMatchObject({
            1: {
                id: receiptId,
            },
        })
    })

    it('should not return cache if the receipt has been modified', async () => {
        const contextId = uuid()
        const receiptId = uuid()
        const importId = uuid()
        await saveReceiptsToCache(contextId, [{ id: receiptId, importId, data: 'some-data' }])
        const cachedValue = await loadReceiptsFromCache(contextId, { 1: { importId, data: 'some-data-2' } })
        expect(cachedValue).toMatchObject({})
    })

    it('should not save cache if no importId presence', async () => {
        const contextId = uuid()
        const receiptId = uuid()
        const importId = null
        await saveReceiptsToCache(contextId, [{ id: receiptId, importId, data: 'some-data' }])
        const cachedValue = await loadReceiptsFromCache(contextId, { 1: { importId, data: 'some-data' } })
        expect(cachedValue).toMatchObject({})
    })

})
