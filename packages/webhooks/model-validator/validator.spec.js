const path = require('path')

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
    })
    describe('Validator', () => {
        const schemaPath = path.resolve(__dirname, 'test.schema.graphql')
        test('Must initialize correctly on valid gql schema', async () => {
            expect(() => new WebHookModelValidator(schemaPath)).not.toThrow()
        })
        test('Must register models correctly', async () => {
            const validator = new WebHookModelValidator(schemaPath)
            expect(() => { validator.registerModel('MyModel') }).not.toThrow()
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
                                ['Single typed field', '{ typedField { subfield } }'],
                                ['Multiple fields 1', '{ stringField manyEnumField }'],
                                ['Multiple fields 2', '{ boolField id manyEnumField }'],
                                ['Multiple with subfields', '{ fileField { publicUrl } typedField { subfield } }'],
                            ]
                            test.each(cases)('%p', (name, fieldString) => {
                                const { isValid, errors } = validator.validateFields('MyModel', fieldString)
                                expect(isValid).toEqual(true)
                                expect(errors).toEqual([])
                            })
                        })
                        describe('Relations', () => {
                            const cases = [
                                ['Simple relation', '{ manyRelation { id } }'],
                                ['Nested relation', '{ manyRelation { model { stringField } } }'],
                            ]
                            test.each(cases)('%p', (name, fieldString) => {
                                const { isValid, errors } = validator.validateFields('MyModel', fieldString)
                                expect(isValid).toEqual(true)
                                expect(errors).toEqual([])
                            })
                        })
                        test('All together', () => {
                            const fieldString = '{ stringField typedField { dv } manyRelation { model { stringField fileField { publicUrl } } id } }'
                            const { isValid, errors } = validator.validateFields('MyModel', fieldString)
                            expect(isValid).toEqual(true)
                            expect(errors).toEqual([])
                        })
                    })
                    describe('Wrong cases', () => {
                        const cases = [
                            ['Empty string', ''],
                            ['Empty wrapped string', '{ }'],
                            ['No subfields 1', '{ manyRelation }'],
                            ['No subfields 2', '{ fileField }'],
                            ['Empty subfields 1', '{ fileField {} }'],
                            ['Empty relation subfields 2', '{ manyRelation { } }'],
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
                            ['Single relation filter', { manyRelation_some: { id_in: ['1234'] } }],
                            ['CreatedBy filter', { createdBy: { id: '1234' } }],
                            ['Modifying time filter', { createdAt_gte: '2022-10-27T12:03:50Z', updatedAt_lt: '2022-10-27T12:03:50Z' }],
                            ['Nullable field', { stringField: null, stringField_not: null }],
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
                            ['Both', { AND: [{ boolField: true }, { OR: [{ stringField_i: 'value' }, { manyRelation_some: { model: { intField: 1 } } }] }] }],
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