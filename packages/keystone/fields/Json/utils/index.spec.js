const { serialize, deserialize } = require('./index')

describe('Json utils', () => {
    describe('deserialize', () => {
        it('should return null for empty data', () => {
            const result = deserialize(null, 'testField')
            expect(result).toBeNull()
        })

        it('should return null for undefined data', () => {
            const result = deserialize(undefined, 'testField')
            expect(result).toBeNull()
        })

        it('should return null for data without path', () => {
            const result = deserialize({}, 'testField')
            expect(result).toBeNull()
        })

        it('should return null for data with empty string at path', () => {
            const result = deserialize({ testField: '' }, 'testField')
            expect(result).toBeNull()
        })

        it('should stringify object data', () => {
            const data = { testField: { key: 'value' } }
            const result = deserialize(data, 'testField')
            expect(typeof result).toBe('string')
            expect(result).toBe('{"key":"value"}')
        })

        it('should stringify array data', () => {
            const data = { testField: [{ id: 1 }, { id: 2 }] }
            const result = deserialize(data, 'testField')
            expect(typeof result).toBe('string')
            expect(result).toBe('[{"id":1},{"id":2}]')
        })

        it('should remove __typename before stringifying', () => {
            const data = { testField: { key: 'value', __typename: 'TestType' } }
            const result = deserialize(data, 'testField')
            expect(result).toBe('{"key":"value"}')
            expect(result).not.toContain('__typename')
        })

        it('should remove __typename from array items before stringifying', () => {
            const data = { testField: [{ id: 1, __typename: 'Type1' }, { id: 2, __typename: 'Type2' }] }
            const result = deserialize(data, 'testField')
            expect(typeof result).toBe('string')
            expect(result).toBe('[{"id":1},{"id":2}]')
            expect(result).not.toContain('__typename')
        })

        it('should handle nested __typename removal', () => {
            const data = {
                testField: {
                    parent: {
                        __typename: 'Parent',
                        child: {
                            __typename: 'Child',
                            value: 'test',
                        },
                    },
                },
            }
            const result = deserialize(data, 'testField')
            expect(result).toBe('{"parent":{"child":{"value":"test"}}}')
            expect(result).not.toContain('__typename')
        })

        it('should handle deeply nested structures with __typename', () => {
            const data = {
                testField: {
                    level1: {
                        __typename: 'Level1',
                        level2: {
                            __typename: 'Level2',
                            level3: {
                                __typename: 'Level3',
                                value: 'deep',
                            },
                        },
                    },
                },
            }
            const result = deserialize(data, 'testField')
            expect(result).toBe('{"level1":{"level2":{"level3":{"value":"deep"}}}}')
            expect(result).not.toContain('__typename')
        })

        it('should handle arrays with nested objects containing __typename', () => {
            const data = {
                testField: [
                    {
                        id: 1,
                        __typename: 'Item',
                        nested: {
                            __typename: 'Nested',
                            value: 'test1',
                        },
                    },
                    {
                        id: 2,
                        __typename: 'Item',
                        nested: {
                            __typename: 'Nested',
                            value: 'test2',
                        },
                    },
                ],
            }
            const result = deserialize(data, 'testField')
            expect(result).toBe('[{"id":1,"nested":{"value":"test1"}},{"id":2,"nested":{"value":"test2"}}]')
            expect(result).not.toContain('__typename')
        })

        it('should work with different path names', () => {
            const data = { customPath: { key: 'value' } }
            const result = deserialize(data, 'customPath')
            expect(result).toBe('{"key":"value"}')
        })
    })

    describe('serialize', () => {
        it('should return null for empty data', () => {
            const result = serialize(null, 'testField')
            expect(result).toBeNull()
        })

        it('should return null for undefined data', () => {
            const result = serialize(undefined, 'testField')
            expect(result).toBeNull()
        })

        it('should return null for data without path', () => {
            const result = serialize({}, 'testField')
            expect(result).toBeNull()
        })

        it('should return null for data with empty string at path', () => {
            const result = serialize({ testField: '' }, 'testField')
            expect(result).toBeNull()
        })

        it('should parse JSON string and return object', () => {
            const data = { testField: '{"key":"value"}' }
            const result = serialize(data, 'testField')
            expect(result).toStrictEqual({ key: 'value' })
        })

        it('should handle array input and return array', () => {
            const data = { testField: [{ id: 1 }, { id: 2 }] }
            const result = serialize(data, 'testField')
            expect(typeof result).not.toBe('string')
            expect(Array.isArray(result)).toBe(true)
            expect(result).toStrictEqual([{ id: 1 }, { id: 2 }])
        })

        it('should convert array to JSON string before parsing', () => {
            const data = { testField: [{ id: 1, name: 'test' }] }
            const result = serialize(data, 'testField')
            expect(Array.isArray(result)).toBe(true)
            expect(result).toStrictEqual([{ id: 1, name: 'test' }])
        })

        it('should remove __typename from nested objects', () => {
            const data = { testField: '{"key":"value","__typename":"TestType"}' }
            const result = serialize(data, 'testField')
            expect(result).toStrictEqual({ key: 'value' })
            expect(result.__typename).toBeUndefined()
        })

        it('should remove __typename from array items', () => {
            const data = { testField: [{ id: 1, __typename: 'Type1' }, { id: 2, __typename: 'Type2' }] }
            const result = serialize(data, 'testField')
            expect(Array.isArray(result)).toBe(true)
            expect(result).toStrictEqual([{ id: 1 }, { id: 2 }])
            expect(result[0].__typename).toBeUndefined()
            expect(result[1].__typename).toBeUndefined()
        })

        it('should handle complex nested structures without returning string', () => {
            const data = {
                testField: [
                    {
                        id: 1,
                        nested: { value: 'test', __typename: 'Nested' },
                        __typename: 'Parent',
                    },
                ],
            }
            const result = serialize(data, 'testField')
            expect(typeof result).not.toBe('string')
            expect(Array.isArray(result)).toBe(true)
            expect(result).toStrictEqual([
                {
                    id: 1,
                    nested: { value: 'test' },
                },
            ])
        })

        it('should handle deeply nested __typename removal', () => {
            const data = {
                testField: '{"level1":{"__typename":"Level1","level2":{"__typename":"Level2","value":"deep"}}}',
            }
            const result = serialize(data, 'testField')
            expect(result).toStrictEqual({
                level1: {
                    level2: {
                        value: 'deep',
                    },
                },
            })
        })

        it('should work with different path names', () => {
            const data = { customPath: '{"key":"value"}' }
            const result = serialize(data, 'customPath')
            expect(result).toStrictEqual({ key: 'value' })
        })

        it('should handle mixed arrays with objects and primitives', () => {
            const data = { testField: [{ id: 1 }, 'string', 123, null] }
            const result = serialize(data, 'testField')
            expect(Array.isArray(result)).toBe(true)
            expect(result).toStrictEqual([{ id: 1 }, 'string', 123, null])
        })
    })
})
