const { canonicalize } = require('./object.utils')

describe('canonicalize', () => {

    test('should handle primitive types correctly', () => {
        expect(canonicalize(123)).toBe('123')
        expect(canonicalize('test')).toBe('"test"')
        expect(canonicalize(true)).toBe('true')
        expect(canonicalize(null)).toBe('null')
        expect(canonicalize(undefined)).toBeUndefined()
    })

    test('should handle empty objects and arrays', () => {
        expect(canonicalize({})).toBe('{}')
        expect(canonicalize([])).toBe('[]')
    })

    test('should handle arrays of primitive types', () => {
        expect(canonicalize([1, 2, 3])).toBe('[1,2,3]')
        expect(canonicalize(['a', 'b', 'c'])).toBe('["a","b","c"]')
    })

    test('should handle arrays of objects', () => {
        const array = [{ b: 2, a: 1 }, { d: 4, c: 3 }]
        expect(canonicalize(array)).toBe('[{"a":1,"b":2},{"c":3,"d":4}]')
    })

    test('should handle objects with sorted keys', () => {
        const obj = { b: 2, a: 1, c: 3 }
        expect(canonicalize(obj)).toBe('{"a":1,"b":2,"c":3}')
    })

    test('should handle nested objects', () => {
        const obj = { z: { b: 2, a: 1 }, x: 3 }
        expect(canonicalize(obj)).toBe('{"x":3,"z":{"a":1,"b":2}}')
    })

    test('should handle mixed structures', () => {
        const mixed = { a: [1, { b: 2, a: 1 }], c: 3 }
        expect(canonicalize(mixed)).toBe('{"a":[1,{"a":1,"b":2}],"c":3}')
    })

    test('should handle objects with null values', () => {
        const obj = { a: null, b: 1 }
        expect(canonicalize(obj)).toBe('{"a":null,"b":1}')
    })

})
