const { ACTIVE_BANKING_FEATURE, HIGH_REVENUE_CUSTOMER_FEATURE } = require('@condo/domains/organization/constants/features')

const {
    evaluateConditions,
    validateConditions,
    createEngine,
    SUPPORTED_FACTS,
    SUPPORTED_OPERATORS,
} = require('./conditionsEvaluator')


describe('conditionsEvaluator', () => {
    describe('evaluateConditions (json-rules-engine)', () => {
        const orgWithFeatures = {
            id: 'org-123',
            features: [ACTIVE_BANKING_FEATURE, HIGH_REVENUE_CUSTOMER_FEATURE],
        }

        const orgWithoutFeatures = {
            id: 'org-456',
            features: [],
        }

        test('null conditions match everything', async () => {
            expect(await evaluateConditions(null, { organization: orgWithFeatures })).toBe(true)
        })

        test('empty conditions match everything', async () => {
            expect(await evaluateConditions({}, { organization: orgWithFeatures })).toBe(true)
        })

        describe('contains operator', () => {
            test('match when array contains value', async () => {
                const conditions = {
                    all: [{ fact: 'organizationFeatures', operator: 'contains', value: ACTIVE_BANKING_FEATURE }],
                }
                expect(await evaluateConditions(conditions, { organization: orgWithFeatures })).toBe(true)
            })

            test('no match when array does not contain value', async () => {
                const conditions = {
                    all: [{ fact: 'organizationFeatures', operator: 'contains', value: ACTIVE_BANKING_FEATURE }],
                }
                expect(await evaluateConditions(conditions, { organization: orgWithoutFeatures })).toBe(false)
            })
        })

        describe('organizationIds', () => {
            test('match specific org by id', async () => {
                const conditions = {
                    all: [{ fact: 'organizationIds', operator: 'contains', value: 'org-123' }],
                }
                expect(await evaluateConditions(conditions, { organization: orgWithFeatures })).toBe(true)
            })

            test('no match for different org', async () => {
                const conditions = {
                    all: [{ fact: 'organizationIds', operator: 'contains', value: 'other-org' }],
                }
                expect(await evaluateConditions(conditions, { organization: orgWithFeatures })).toBe(false)
            })
        })

        describe('all (AND)', () => {
            test('match when all conditions true', async () => {
                const conditions = {
                    all: [
                        { fact: 'organizationFeatures', operator: 'contains', value: ACTIVE_BANKING_FEATURE },
                        { fact: 'organizationFeatures', operator: 'contains', value: HIGH_REVENUE_CUSTOMER_FEATURE },
                    ],
                }
                expect(await evaluateConditions(conditions, { organization: orgWithFeatures })).toBe(true)
            })

            test('no match when one condition false', async () => {
                const conditions = {
                    all: [
                        { fact: 'organizationFeatures', operator: 'contains', value: ACTIVE_BANKING_FEATURE },
                        { fact: 'organizationFeatures', operator: 'contains', value: HIGH_REVENUE_CUSTOMER_FEATURE },
                    ],
                }
                expect(await evaluateConditions(conditions, { organization: { ...orgWithFeatures, features: [ACTIVE_BANKING_FEATURE] } })).toBe(false)
            })
        })

        describe('any', () => {
            test('match when at least one condition true', async () => {
                const conditions = {
                    any: [
                        { fact: 'organizationIds', operator: 'contains', value: 'other-org' },
                        { fact: 'organizationFeatures', operator: 'contains', value: ACTIVE_BANKING_FEATURE },
                    ],
                }
                expect(await evaluateConditions(conditions, { organization: orgWithFeatures })).toBe(true)
            })

            test('no match when all conditions false', async () => {
                const conditions = {
                    any: [
                        { fact: 'organizationIds', operator: 'contains', value: 'other-org' },
                        { fact: 'organizationFeatures', operator: 'contains', value: ACTIVE_BANKING_FEATURE },
                    ],
                }
                expect(await evaluateConditions(conditions, { organization: orgWithoutFeatures })).toBe(false)
            })
        })

        describe('nested conditions', () => {
            test('nested all inside any', async () => {
                const conditions = {
                    any: [
                        {
                            all: [
                                { fact: 'organizationFeatures', operator: 'contains', value: ACTIVE_BANKING_FEATURE },
                                { fact: 'organizationFeatures', operator: 'contains', value: HIGH_REVENUE_CUSTOMER_FEATURE },
                            ],
                        },
                        { fact: 'organizationIds', operator: 'contains', value: 'special-org' },
                    ],
                }
                expect(await evaluateConditions(conditions, { organization: orgWithFeatures })).toBe(true)
            })
        })

        test('null organization context', async () => {
            const conditions = {
                all: [{ fact: 'organizationFeatures', operator: 'contains', value: ACTIVE_BANKING_FEATURE }],
            }
            expect(await evaluateConditions(conditions, { organization: null })).toBe(false)
        })
    })

    describe('validateConditions', () => {
        test('null is valid', () => {
            expect(validateConditions(null)).toEqual({ valid: true })
        })

        test('empty object is valid', () => {
            expect(validateConditions({})).toEqual({ valid: true })
        })

        test('valid all conditions', () => {
            const conditions = {
                all: [
                    { fact: 'organizationFeatures', operator: 'contains', value: ACTIVE_BANKING_FEATURE },
                    { fact: 'organizationIds', operator: 'contains', value: 'org-123' },
                ],
            }
            expect(validateConditions(conditions)).toEqual({ valid: true })
        })

        test('valid any conditions', () => {
            const conditions = {
                any: [
                    { fact: 'organizationIds', operator: 'contains', value: 'org-123' },
                    { fact: 'organizationFeatures', operator: 'contains', value: ACTIVE_BANKING_FEATURE },
                ],
            }
            expect(validateConditions(conditions)).toEqual({ valid: true })
        })

        test('valid single condition at root', () => {
            const conditions = { fact: 'organizationIds', operator: 'contains', value: 'org-123' }
            expect(validateConditions(conditions)).toEqual({ valid: true })
        })

        test('unsupported fact is invalid', () => {
            const conditions = { fact: 'unknownFact', operator: 'equal', value: 'x' }
            const result = validateConditions(conditions)
            expect(result.valid).toBe(false)
            expect(result.error).toContain('unsupported fact')
        })

        test('unsupported operator is invalid', () => {
            const conditions = { fact: 'organizationIds', operator: 'unknownOp', value: 'x' }
            const result = validateConditions(conditions)
            expect(result.valid).toBe(false)
            expect(result.error).toContain('unsupported operator')
        })

        test('missing value is invalid', () => {
            const conditions = { fact: 'organizationIds', operator: 'contains' }
            const result = validateConditions(conditions)
            expect(result.valid).toBe(false)
            expect(result.error).toContain('missing "value"')
        })

        test('missing operator is invalid', () => {
            const conditions = { fact: 'organizationIds', value: 'x' }
            const result = validateConditions(conditions)
            expect(result.valid).toBe(false)
            expect(result.error).toContain('missing or invalid "operator"')
        })

        test('all must be array', () => {
            const conditions = { all: 'not array' }
            const result = validateConditions(conditions)
            expect(result.valid).toBe(false)
            expect(result.error).toContain('must be an array')
        })

        test('in operator requires array value', () => {
            const conditions = { fact: 'organizationIds', operator: 'in', value: 'not-array' }
            const result = validateConditions(conditions)
            expect(result.valid).toBe(false)
            expect(result.error).toContain('must be an array')
        })

        test('non-object is invalid', () => {
            const result = validateConditions('invalid')
            expect(result.valid).toBe(false)
            expect(result.error).toContain('must be an object')
        })

        test('array is invalid', () => {
            const result = validateConditions([])
            expect(result.valid).toBe(false)
            expect(result.error).toContain('must be an object')
        })
    })


    describe('createEngine', () => {
        test('creates engine', () => {
            const engine = createEngine()
            expect(engine).toBeDefined()
            expect(typeof engine.addRule).toBe('function')
            expect(typeof engine.run).toBe('function')
        })

        test('engine can run rules', async () => {
            const engine = createEngine()
            engine.addRule({
                conditions: {
                    all: [{ fact: 'testFact', operator: 'equal', value: 'testValue' }],
                },
                event: { type: 'test-event' },
            })

            const { events } = await engine.run({ testFact: 'testValue' })
            expect(events).toHaveLength(1)
            expect(events[0].type).toBe('test-event')
        })
    })

    describe('exports', () => {
        test('SUPPORTED_FACTS', () => {
            expect(SUPPORTED_FACTS).toContain('organizationIds')
            expect(SUPPORTED_FACTS).toContain('organizationFeatures')
        })

        test('SUPPORTED_OPERATORS', () => {
            expect(SUPPORTED_OPERATORS).toContain('contains')
            expect(SUPPORTED_OPERATORS).toContain('equal')
            expect(SUPPORTED_OPERATORS).toContain('notEqual')
            expect(SUPPORTED_OPERATORS).toContain('in')
            expect(SUPPORTED_OPERATORS).toContain('notIn')
        })
    })
})
