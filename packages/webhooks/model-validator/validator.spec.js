const path = require('path')
const get = require('lodash/get')
const { WebHookModelValidator } = require('./validator')

describe('WebHookModelValidator', () => {
    describe('Utils', () => {
        describe('normalizeFieldsString', () => {
            const cases = [
                ['', '{ }'],
                ['a b', '{ a b }'],
                ['a b{c}', '{ a b { c } }'],
                ['a b{c}d', '{ a b { c } d }'],
                ['{a b{c{d}}e}', '{ a b { c { d } } e }'],
                ['{a b    c { d e{f} g{h i} }   j{k \n  }l}', '{ a b c { d e { f } g { h i } } j { k } l }'],
                ['a\nb\n\n\t{c}', '{ a b { c } }'],
            ]
            test.each(cases)('%p', (raw, expected) => {
                expect(WebHookModelValidator.normalizeFieldsString(raw)).toEqual(expected)
            })
        })
        describe('_buildSampleFromFieldsString', () => {
            describe('Must build correct sample', () => {
                const validCases = [
                    ['{ }', {}],
                    ['{ a { } }', { a: {} }],
                    ['{ a b }', { a: true, b: true }],
                    ['{ a b { c } }', { a: true, b: { c: true } }],
                    ['{ a b c { d e { f } g { h i } } j { k } l }', {
                        a: true,
                        b: true,
                        c: { d: true, e: { f: true }, g: { h: true, i: true } },
                        j: { k: true },
                        l: true,
                    }],
                ]
                test.each(validCases)('%p', (normalized, expected) => {
                    const { data, error } = WebHookModelValidator._buildSampleFromFieldsString(normalized)
                    expect(error).toBeNull()
                    expect(data).toEqual(expected)
                })
            })
            describe('Must return error if not succeed', () => {
                const invalidCases = [
                    ['{ { } }'],
                    ['{ a { b } } }'],
                    ['{ a { { b }'],
                ]
                test.each(invalidCases)('%p', (normalized) => {
                    const { data, error } = WebHookModelValidator._buildSampleFromFieldsString(normalized)
                    expect(data).toBeNull()
                    expect(error).not.toBeNull()
                })
            })
        })
        describe('_maskSchemaTypes', () => {
            const shortcut = ['definitions', 'MyModel', 'properties']
            const originalSchema = require(path.join(__dirname, 'test.schema.json'))
            const maskedSchema = WebHookModelValidator._maskSchemaTypes(originalSchema)

            describe('Must replace primitive types with boolean', () => {
                test('Enum', () => {
                    expect(get(originalSchema, [...shortcut, '__typename', 'enum'])).toBeDefined()
                    expect(get(maskedSchema, [...shortcut, '__typename'])).toEqual({ type: 'boolean' })
                })
                test('String', () => {
                    expect(get(originalSchema, [...shortcut, 'stringField', 'type'])).toEqual('string')
                    expect(get(maskedSchema, [...shortcut, 'stringField'])).toEqual({ type: 'boolean' })
                })
                test('Number', () => {
                    expect(get(originalSchema, [...shortcut, 'intField', 'type'])).toEqual('number')
                    expect(get(maskedSchema, [...shortcut, 'intField'])).toEqual({ type: 'boolean' })
                })
            })
            test('Must replace nested types', () => {
                expect(get(originalSchema, [...shortcut, 'fileField', 'properties', 'id', 'type'])).toEqual('string')
                expect(get(maskedSchema, [...shortcut, 'fileField', 'properties', 'id'])).toEqual({ type: 'boolean' })
            })
            test('Must replace arrays with items', () => {
                expect(get(originalSchema, [...shortcut, 'manyRelationField', 'type'])).toEqual('array')
                const originalRef = get(originalSchema, [...shortcut, 'manyRelationField', 'items', '$ref'])
                expect(originalRef).toBeDefined()
                expect(get(maskedSchema, [...shortcut, 'manyRelationField', '$ref'])).toEqual(originalRef)
            })
            test('Must add non-empty subfields criteria', () => {
                expect(originalSchema).not.toHaveProperty(['definitions', 'MyModel', 'minProperties'])
                expect(maskedSchema).toHaveProperty(['definitions', 'MyModel', 'minProperties'], 1)
            })
            test('Must add no custom properties criteria', () => {
                expect(maskedSchema).toHaveProperty(['definitions', 'MyModel', 'additionalProperties'], false)
            })
        })
    })
    describe('Validator', () => {
        const schemaPath = path.resolve(__dirname, 'test.schema.ts')
        test('Must be created correctly', () => {
            const validator = new WebHookModelValidator(schemaPath)
            expect(validator).toBeDefined()
        })
        describe('Validating', () => {
            const validator = new WebHookModelValidator(schemaPath)
            validator.registerModel('MyModel')
            describe('Fields', () => {
                describe('Must correctly parse fields for registered models', () => {
                    describe('Correct cases', () => {
                        describe('Simple fields', () => {
                            const cases = [
                                ['Single string', '{ stringField }'],
                                ['Single enum', '{ manyEnumField }'],
                                ['Single boolean', '{ boolField }'],
                                ['Single number', '{ intField }'],
                                ['Single ID field', '{ id }'],
                                ['Single with subfields', '{ fileField { publicUrl } }'],
                                ['Single typed field', '{ typedField { substring } }'],
                                ['Multiple fields 1', '{ stringField manyEnumField }'],
                                ['Multiple fields 2', '{ boolField id manyEnumField }'],
                                ['Multiple with subfields', '{ fileField { publicUrl } typedField { substring } }'],
                            ]
                            test.each(cases)('%p', (name, fieldString) => {
                                const { isValid, errors } = validator.validateFields('MyModel', fieldString)
                                expect(isValid).toEqual(true)
                                expect(errors).toEqual([])
                            })
                        })
                        describe('Relations', () => {
                            const cases = [
                                ['Simple relation', '{ manyRelationField { id } }'],
                                ['Nested relation', '{ manyRelationField { myModel { stringField } __typename } }'],
                            ]
                            test.each(cases)('%p', (name, fieldString) => {
                                const { isValid, errors } = validator.validateFields('MyModel', fieldString)
                                expect(isValid).toEqual(true)
                                expect(errors).toEqual([])
                            })
                        })
                        test('All together', () => {
                            const fieldString = '{ stringField typedField { dv } manyRelationField { myModel { stringField fileField { publicUrl } } id } }'
                            const { isValid, errors } = validator.validateFields('MyModel', fieldString)
                            expect(isValid).toEqual(true)
                            expect(errors).toEqual([])
                        })
                    })
                    describe('Wrong cases', () => {
                        const cases = [
                            ['Empty string', ''],
                            ['Empty wrapped string', '{ }'],
                            ['No subfields 1', '{ manyRelationField }'],
                            ['No subfields 2', '{ fileField }'],
                            ['Empty subfields 1', '{ fileField {} }'],
                            ['Empty relation subfields 2', '{ manyRelationField { } }'],
                            ['Non-existing fields', '{ myNonExistingField }'],
                            ['Non-existing subfields 1', '{ fileField { coolness } }'],
                            ['Non-existing subfields 2', '{ stringField { coolness } }'],
                        ]
                        test.each(cases)('%p', (name, fieldString) => {
                            const { isValid, errors } = validator.validateFields('MyModel', fieldString)
                            expect(isValid).toEqual(false)
                            expect(errors).not.toHaveLength(0)
                        })
                    })
                })
            })
            describe('Filters', () => {
                describe('Must correctly parse filters for registered models', () => {
                    describe('Simple cases', () => {
                        const cases = [
                            ['Explicitly empty filter', {}],
                            ['Single string filter', { stringField_contains_i: 'Name' }],
                            ['Single enum filter', { manyEnumField: ['EnumValue'] }],
                            ['Single relation filter', { manyRelationField_some: { id_in: ['1234'] } }],
                        ]
                        test.each(cases)('%p', (name, filter) => {
                            const { isValid, errors } = validator.validateFilters('MyModel', filter)
                            expect(isValid).toEqual(true)
                            expect(errors).toEqual([])
                        })
                    })
                    describe('Filter combinations', () => {
                        const cases = [
                            ['AND', { AND: [{ boolField: true }, { intField_gte: 2 }] }],
                            ['OR', { OR: [{ boolField: true }, { stringField: 'value' }] }],
                            ['Both', { AND: [{ boolField: true }, { OR: [{ stringField_i: 'value' }, { manyRelationField_some: { myModel: { typedField: { dv: 1 } } } }] }] }],
                        ]
                        test.each(cases)('%p', (name, filter) => {
                            const { isValid, errors } = validator.validateFilters('MyModel', filter)
                            expect(isValid).toEqual(true)
                            expect(errors).toEqual([])
                        })
                    })
                    describe('Wrong cases', () => {
                        const cases = [
                            ['Non-existing field', { surname: 'Johnson' }],
                            ['Non-matching type 1', { boolField: 'yes' }],
                            ['Non-matching type 2', { stringField_not_in: 'Obu' }],
                            ['Non-existing value', { manyEnumField: ['Spider-Man'] }],
                        ]
                        test.each(cases)('%p', (name, filter) => {
                            const { isValid, errors } = validator.validateFilters('MyModel', filter)
                            expect(isValid).toEqual(false)
                            expect(errors).not.toHaveLength(0)
                        })
                    })
                })
            })
        })
    })
})