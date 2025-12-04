const { ACTIVE_BANKING_FEATURE, HIGH_REVENUE_CUSTOMER_FEATURE } = require('@condo/domains/organization/constants/features')

const {
    evaluateConditions,
    evaluateConditionsAsync,
    evaluateConditionsWithDetails,
    validateConditions,
    hasOrganizationIdCondition,
    createEngine,
    SUPPORTED_FACTS,
    SUPPORTED_OPERATORS,
} = require('./conditionsEvaluator')


describe('conditionsEvaluator', () => {
    describe('evaluateConditions', () => {
        const orgWithFeatures = {
            id: 'org-123',
            features: [ACTIVE_BANKING_FEATURE, HIGH_REVENUE_CUSTOMER_FEATURE],
        }

        const orgWithoutFeatures = {
            id: 'org-456',
            features: [],
        }

        test('null conditions match everything', () => {
            expect(evaluateConditions(null, { organization: orgWithFeatures })).toBe(true)
        })

        test('empty conditions match everything', () => {
            expect(evaluateConditions({}, { organization: orgWithFeatures })).toBe(true)
        })

        describe('contains operator', () => {
            test('match when array contains value', () => {
                const conditions = {
                    all: [{ fact: 'organizationFeatures', operator: 'contains', value: ACTIVE_BANKING_FEATURE }],
                }
                expect(evaluateConditions(conditions, { organization: orgWithFeatures })).toBe(true)
            })

            test('no match when array does not contain value', () => {
                const conditions = {
                    all: [{ fact: 'organizationFeatures', operator: 'contains', value: ACTIVE_BANKING_FEATURE }],
                }
                expect(evaluateConditions(conditions, { organization: orgWithoutFeatures })).toBe(false)
            })
        })

        describe('doesNotContain operator', () => {
            test('match when array does not contain value', () => {
                const conditions = {
                    all: [{ fact: 'organizationFeatures', operator: 'doesNotContain', value: ACTIVE_BANKING_FEATURE }],
                }
                expect(evaluateConditions(conditions, { organization: orgWithoutFeatures })).toBe(true)
            })
        })

        describe('organizationIds', () => {
            test('match specific org by id', () => {
                const conditions = {
                    all: [{ fact: 'organizationIds', operator: 'contains', value: 'org-123' }],
                }
                expect(evaluateConditions(conditions, { organization: orgWithFeatures })).toBe(true)
            })

            test('no match for different org', () => {
                const conditions = {
                    all: [{ fact: 'organizationIds', operator: 'contains', value: 'other-org' }],
                }
                expect(evaluateConditions(conditions, { organization: orgWithFeatures })).toBe(false)
            })
        })

        describe('all (AND)', () => {
            test('match when all conditions true', () => {
                const conditions = {
                    all: [
                        { fact: 'organizationFeatures', operator: 'contains', value: ACTIVE_BANKING_FEATURE },
                        { fact: 'organizationFeatures', operator: 'contains', value: HIGH_REVENUE_CUSTOMER_FEATURE },
                    ],
                }
                expect(evaluateConditions(conditions, { organization: orgWithFeatures })).toBe(true)
            })

            test('no match when one condition false', () => {
                const conditions = {
                    all: [
                        { fact: 'organizationFeatures', operator: 'contains', value: ACTIVE_BANKING_FEATURE },
                        { fact: 'organizationFeatures', operator: 'contains', value: HIGH_REVENUE_CUSTOMER_FEATURE },
                    ],
                }
                expect(evaluateConditions(conditions, { organization: { ...orgWithFeatures, features: [ACTIVE_BANKING_FEATURE] } })).toBe(false)
            })
        })

        describe('any (OR)', () => {
            test('match when at least one condition true', () => {
                const conditions = {
                    any: [
                        { fact: 'organizationIds', operator: 'contains', value: 'other-org' },
                        { fact: 'organizationFeatures', operator: 'contains', value: ACTIVE_BANKING_FEATURE },
                    ],
                }
                expect(evaluateConditions(conditions, { organization: orgWithFeatures })).toBe(true)
            })

            test('no match when all conditions false', () => {
                const conditions = {
                    any: [
                        { fact: 'organizationIds', operator: 'contains', value: 'other-org' },
                        { fact: 'organizationFeatures', operator: 'contains', value: ACTIVE_BANKING_FEATURE },
                    ],
                }
                expect(evaluateConditions(conditions, { organization: orgWithoutFeatures })).toBe(false)
            })
        })

        describe('nested conditions', () => {
            test('nested all inside any', () => {
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
                expect(evaluateConditions(conditions, { organization: orgWithFeatures })).toBe(true)
            })
        })

        test('null organization context', () => {
            const conditions = {
                all: [{ fact: 'organizationFeatures', operator: 'contains', value: ACTIVE_BANKING_FEATURE }],
            }
            expect(evaluateConditions(conditions, { organization: null })).toBe(false)
        })
    })

    describe('evaluateConditionsWithDetails', () => {
        test('returns failed conditions', () => {
            const conditions = {
                all: [
                    { fact: 'organizationFeatures', operator: 'contains', value: ACTIVE_BANKING_FEATURE },
                    { fact: 'organizationFeatures', operator: 'contains', value: HIGH_REVENUE_CUSTOMER_FEATURE },
                ],
            }
            const result = evaluateConditionsWithDetails(conditions, {
                organization: { id: 'org-1', features: [ACTIVE_BANKING_FEATURE] },
            })

            expect(result.match).toBe(false)
            expect(result.failedConditions).toHaveLength(1)
            expect(result.failedConditions[0].value).toBe(HIGH_REVENUE_CUSTOMER_FEATURE)
        })

        test('empty failedConditions when all match', () => {
            const conditions = {
                all: [{ fact: 'organizationFeatures', operator: 'contains', value: ACTIVE_BANKING_FEATURE }],
            }
            const result = evaluateConditionsWithDetails(conditions, {
                organization: { id: 'org-1', features: [ACTIVE_BANKING_FEATURE] },
            })

            expect(result.match).toBe(true)
            expect(result.failedConditions).toHaveLength(0)
        })

        test('null conditions returns match true', () => {
            const result = evaluateConditionsWithDetails(null, { organization: { id: 'org-1' } })
            expect(result.match).toBe(true)
            expect(result.failedConditions).toHaveLength(0)
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

    describe('evaluateConditionsAsync (json-rules-engine)', () => {
        const orgWithFeatures = {
            id: 'org-123',
            features: [ACTIVE_BANKING_FEATURE, HIGH_REVENUE_CUSTOMER_FEATURE],
        }

        const orgWithoutFeatures = {
            id: 'org-456',
            features: [],
        }

        test('null conditions match everything', async () => {
            expect(await evaluateConditionsAsync(null, { organization: orgWithFeatures })).toBe(true)
        })

        test('empty conditions match everything', async () => {
            expect(await evaluateConditionsAsync({}, { organization: orgWithFeatures })).toBe(true)
        })

        test('match when array contains value', async () => {
            const conditions = {
                all: [{ fact: 'organizationFeatures', operator: 'contains', value: ACTIVE_BANKING_FEATURE }],
            }
            expect(await evaluateConditionsAsync(conditions, { organization: orgWithFeatures })).toBe(true)
        })

        test('no match when array does not contain value', async () => {
            const conditions = {
                all: [{ fact: 'organizationFeatures', operator: 'contains', value: ACTIVE_BANKING_FEATURE }],
            }
            expect(await evaluateConditionsAsync(conditions, { organization: orgWithoutFeatures })).toBe(false)
        })

        test('doesNotContain operator works', async () => {
            const conditions = {
                all: [{ fact: 'organizationFeatures', operator: 'doesNotContain', value: ACTIVE_BANKING_FEATURE }],
            }
            expect(await evaluateConditionsAsync(conditions, { organization: orgWithoutFeatures })).toBe(true)
        })

        test('all (AND) conditions', async () => {
            const conditions = {
                all: [
                    { fact: 'organizationFeatures', operator: 'contains', value: ACTIVE_BANKING_FEATURE },
                    { fact: 'organizationFeatures', operator: 'contains', value: HIGH_REVENUE_CUSTOMER_FEATURE },
                ],
            }
            expect(await evaluateConditionsAsync(conditions, { organization: orgWithFeatures })).toBe(true)
            expect(await evaluateConditionsAsync(conditions, { organization: { ...orgWithFeatures, features: [ACTIVE_BANKING_FEATURE] } })).toBe(false)
        })

        test('any (OR) conditions', async () => {
            const conditions = {
                any: [
                    { fact: 'organizationIds', operator: 'contains', value: 'other-org' },
                    { fact: 'organizationFeatures', operator: 'contains', value: ACTIVE_BANKING_FEATURE },
                ],
            }
            expect(await evaluateConditionsAsync(conditions, { organization: orgWithFeatures })).toBe(true)
            expect(await evaluateConditionsAsync(conditions, { organization: orgWithoutFeatures })).toBe(false)
        })

        test('nested conditions', async () => {
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
            expect(await evaluateConditionsAsync(conditions, { organization: orgWithFeatures })).toBe(true)
        })
    })

    describe('createEngine', () => {
        test('creates engine with doesNotContain operator', () => {
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
            expect(SUPPORTED_OPERATORS).toContain('doesNotContain')
            expect(SUPPORTED_OPERATORS).toContain('equal')
            expect(SUPPORTED_OPERATORS).toContain('notEqual')
            expect(SUPPORTED_OPERATORS).toContain('in')
            expect(SUPPORTED_OPERATORS).toContain('notIn')
        })
    })

    describe('hasOrganizationIdCondition', () => {
        test('returns false for null conditions', () => {
            expect(hasOrganizationIdCondition(null)).toBe(false)
        })

        test('returns false for empty conditions', () => {
            expect(hasOrganizationIdCondition({})).toBe(false)
        })

        test('returns true for single organizationIds condition', () => {
            const conditions = { fact: 'organizationIds', operator: 'contains', value: 'org-123' }
            expect(hasOrganizationIdCondition(conditions)).toBe(true)
        })

        test('returns true for organizationIds in all array', () => {
            const conditions = {
                all: [
                    { fact: 'organizationIds', operator: 'contains', value: 'org-123' },
                    { fact: 'organizationFeatures', operator: 'contains', value: ACTIVE_BANKING_FEATURE },
                ],
            }
            expect(hasOrganizationIdCondition(conditions)).toBe(true)
        })

        test('returns true for organizationIds in any array', () => {
            const conditions = {
                any: [
                    { fact: 'organizationIds', operator: 'contains', value: 'org-123' },
                    { fact: 'organizationFeatures', operator: 'contains', value: ACTIVE_BANKING_FEATURE },
                ],
            }
            expect(hasOrganizationIdCondition(conditions)).toBe(true)
        })

        test('returns true for nested organizationIds condition', () => {
            const conditions = {
                any: [
                    {
                        all: [
                            { fact: 'organizationIds', operator: 'contains', value: 'org-123' },
                        ],
                    },
                    { fact: 'organizationFeatures', operator: 'contains', value: ACTIVE_BANKING_FEATURE },
                ],
            }
            expect(hasOrganizationIdCondition(conditions)).toBe(true)
        })

        test('returns false for conditions without organizationIds', () => {
            const conditions = {
                all: [
                    { fact: 'organizationFeatures', operator: 'contains', value: ACTIVE_BANKING_FEATURE },
                    { fact: 'organizationFeatures', operator: 'contains', value: HIGH_REVENUE_CUSTOMER_FEATURE },
                ],
            }
            expect(hasOrganizationIdCondition(conditions)).toBe(false)
        })

        test('returns false for non-object input', () => {
            expect(hasOrganizationIdCondition('string')).toBe(false)
            expect(hasOrganizationIdCondition(123)).toBe(false)
            expect(hasOrganizationIdCondition(undefined)).toBe(false)
        })
    })
})
