const { faker } = require('@faker-js/faker')

const { hashJSON, mergeAddressAndHelpers } = require('./searchServiceUtils')

describe('Search service utils', () => {
    describe('hashJSON()', () => {
        test('hash should equals known value', () => {
            const obj = { a: 1, b: 2 }
            const hash = hashJSON(obj)
            expect(hash).toEqual('608de49a4600dbb5b173492759792e4a')
        })

        test('should return the same hash for objects with the same properties in different order', () => {
            const obj1 = { a: 1, b: 2 }
            const obj2 = { b: 2, a: 1 }
            const hash1 = hashJSON(obj1)
            const hash2 = hashJSON(obj2)
            expect(hash1).toEqual(hash2)
        })

        test('should return a different hash for objects with different properties', () => {
            const obj1 = { a: 1, b: 2 }
            const obj2 = { c: 3, d: 4 }
            const hash1 = hashJSON(obj1)
            const hash2 = hashJSON(obj2)
            expect(hash1).not.toEqual(hash2)
        })

        test('should return a different hash for objects with nested objects with different properties', () => {
            const obj1 = { a: 1, b: { c: 2, d: 3 } }
            const obj2 = { a: 1, b: { c: 3, d: 2 } }
            const hash1 = hashJSON(obj1)
            const hash2 = hashJSON(obj2)
            expect(hash1).not.toEqual(hash2)
        })

        test('should return the same hash for objects with nested objects with the same properties in different order', () => {
            const obj1 = { a: 1, b: { c: 2, d: 3 } }
            const obj2 = { a: 1, b: { d: 3, c: 2 } }
            const hash1 = hashJSON(obj1)
            const hash2 = hashJSON(obj2)
            expect(hash1).toEqual(hash2)
        })
    })

    describe('mergeAddressAndHelpers()', () => {
        test('merge result with given helpers should convert to known result', () => {
            const address = faker.address.streetAddress(true)
            const helpers = { tin: '593940145273' }
            const merged = mergeAddressAndHelpers(address, helpers)

            expect(merged).toEqual(`${address}|helpers:ef6b9990cbb9ed9ea9e3cc4687389e16`)
        })

        test('should return the same hash for helpers with the same properties in different order', () => {
            const helpers1 = { a: 1, b: 2 }
            const helpers2 = { b: 2, a: 1 }
            const address = faker.address.streetAddress(true)

            const merged1 = mergeAddressAndHelpers(address, helpers1)
            const merged2 = mergeAddressAndHelpers(address, helpers2)

            expect(merged1).toEqual(merged2)
        })

        test('should return the same address if there are no helpers', () => {
            const address = faker.address.streetAddress(true)

            const merged1 = mergeAddressAndHelpers(address)
            const merged2 = mergeAddressAndHelpers(address, {})
            const merged3 = mergeAddressAndHelpers(address, [])
            const merged4 = mergeAddressAndHelpers(address, null)
            const merged5 = mergeAddressAndHelpers(address, undefined)
            const merged6 = mergeAddressAndHelpers(address, '')
            const merged7 = mergeAddressAndHelpers(address, 'some string')
            const merged8 = mergeAddressAndHelpers(address, 42)

            expect(merged1).toEqual(address)
            expect(merged2).toEqual(address)
            expect(merged3).toEqual(address)
            expect(merged4).toEqual(address)
            expect(merged5).toEqual(address)
            expect(merged6).toEqual(address)
            expect(merged7).toEqual(address)
            expect(merged8).toEqual(address)
        })
    })
})
