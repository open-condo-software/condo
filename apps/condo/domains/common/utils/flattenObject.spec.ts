import { flattenObject } from './flattenObject'

describe('flattenObject', () => {
    it('should flatten a simple nested object', () => {
        const input = {
            user: {
                name: 'John',
                age: 30,
            },
            active: true,
        }
        const expected = {
            'user.name': 'John',
            'user.age': 30,
            'active': true,
        }
        expect(flattenObject(input)).toEqual(expected)
    })

    it('should flatten arrays by appending values to keys and setting them to "true"', () => {
        const input = {
            roles: ['admin', 'editor'],
            tags: ['react', 'typescript'],
        }
        const expected = {
            'roles.admin': 'true',
            'roles.editor': 'true',
            'tags.react': 'true',
            'tags.typescript': 'true',
        }
        expect(flattenObject(input)).toEqual(expected)
    })

    it('should handle deep nesting (3+ levels)', () => {
        const input = {
            a: {
                b: {
                    c: {
                        d: 'value',
                    },
                },
            },
        }
        const expected = {
            'a.b.c.d': 'value',
        }
        expect(flattenObject(input)).toEqual(expected)
    })

    it('should handle complex mixed objects (example from JSDoc)', () => {
        const input = {
            user: {
                name: 'John',
                roles: ['admin', 'editor'],
            },
            active: true,
        }
        const expected = {
            'user.name': 'John',
            'user.roles.admin': 'true',
            'user.roles.editor': 'true',
            'active': true,
        }
        expect(flattenObject(input)).toEqual(expected)
    })

    it('should handle null values correctly (not as objects)', () => {
        const input = {
            data: null,
            info: {
                status: null,
            },
        }
        const expected = {
            'data': null,
            'info.status': null,
        }
        expect(flattenObject(input)).toEqual(expected)
    })

    it('should return an empty object when input is empty', () => {
        expect(flattenObject({})).toEqual({})
    })

    it('should handle objects containing empty arrays', () => {
        const input = {
            list: [],
            meta: 'data',
        }
        const expected = {
            'meta': 'data',
        }
        expect(flattenObject(input)).toEqual(expected)
    })

    it('should work with different primitive types', () => {
        const input = {
            str: 'text',
            num: 123,
            bool: false,
            undef: undefined,
        }
        expect(flattenObject(input)).toEqual(input)
    })
})