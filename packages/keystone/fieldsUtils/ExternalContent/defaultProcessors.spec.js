const { DEFAULT_PROCESSORS } = require('./defaultProcessors')

describe('DEFAULT_PROCESSORS', () => {
    test('exports json, xml and text processors', () => {
        expect(DEFAULT_PROCESSORS).toHaveProperty('json')
        expect(DEFAULT_PROCESSORS).toHaveProperty('xml')
        expect(DEFAULT_PROCESSORS).toHaveProperty('text')
    })

    test('each processor has required fields', () => {
        for (const [, processor] of Object.entries(DEFAULT_PROCESSORS)) {
            expect(typeof processor.graphQLInputType).toBe('string')
            expect(typeof processor.graphQLReturnType).toBe('string')
            expect(typeof processor.serialize).toBe('function')
            expect(typeof processor.deserialize).toBe('function')
            expect(typeof processor.mimetype).toBe('string')
            expect(typeof processor.fileExt).toBe('string')
        }
    })

    describe('json', () => {
        const { serialize, deserialize } = DEFAULT_PROCESSORS.json

        describe('serialize', () => {
            test('serializes object to JSON string', () => {
                expect(serialize({ a: 1 })).toBe('{"a":1}')
            })

            test('serializes null to "null"', () => {
                expect(serialize(null)).toBe('null')
            })

            test('serializes undefined as "null"', () => {
                expect(serialize(undefined)).toBe('null')
            })

            test('serializes array', () => {
                expect(serialize([1, 2, 3])).toBe('[1,2,3]')
            })
        })

        describe('deserialize', () => {
            test('deserializes valid JSON string to object', () => {
                expect(deserialize('{"a":1}')).toEqual({ a: 1 })
            })

            test('returns null for empty string', () => {
                expect(deserialize('')).toBeNull()
            })

            test('deserializes null literal', () => {
                expect(deserialize('null')).toBeNull()
            })

            test('deserializes array', () => {
                expect(deserialize('[1,2,3]')).toEqual([1, 2, 3])
            })

            test('throws on invalid JSON', () => {
                expect(() => deserialize('{invalid}')).toThrow('Failed to parse JSON content')
            })
        })
    })

    describe('xml', () => {
        const { serialize, deserialize } = DEFAULT_PROCESSORS.xml

        describe('serialize', () => {
            test('returns string as-is', () => {
                expect(serialize('<root/>')).toBe('<root/>')
            })

            test('serializes null to empty string', () => {
                expect(serialize(null)).toBe('')
            })

            test('serializes undefined to empty string', () => {
                expect(serialize(undefined)).toBe('')
            })

            test('coerces non-string values to string', () => {
                expect(serialize(42)).toBe('42')
            })
        })

        describe('deserialize', () => {
            test('returns raw string as-is', () => {
                expect(deserialize('<root/>')).toBe('<root/>')
            })

            test('returns null for empty string', () => {
                expect(deserialize('')).toBeNull()
            })
        })
    })

    describe('text', () => {
        const { serialize, deserialize } = DEFAULT_PROCESSORS.text

        describe('serialize', () => {
            test('returns string as-is', () => {
                expect(serialize('hello world')).toBe('hello world')
            })

            test('serializes null to empty string', () => {
                expect(serialize(null)).toBe('')
            })

            test('serializes undefined to empty string', () => {
                expect(serialize(undefined)).toBe('')
            })

            test('coerces non-string values to string', () => {
                expect(serialize(123)).toBe('123')
            })
        })

        describe('deserialize', () => {
            test('returns raw string as-is', () => {
                expect(deserialize('hello world')).toBe('hello world')
            })

            test('returns null for empty string', () => {
                expect(deserialize('')).toBeNull()
            })
        })
    })
})
