const { FeeDistributionSchemaJsonValidator } = require('./FeeDistribution')

describe('FeeDistributionSchemaJsonValidator', () => {
    const validItem = {
        recipient: 'organization',
        percent: '1',
    }

    const validCases = [
        ['minimal', [validItem]],
        ['complete', [{
            ...validItem,
            percent: '1.5',
            minAmount: '10',
            maxAmount: '1000.99',
            category: '123e4567-e89b-12d3-a456-426614174000',
        }]],
        ['multiple items', [
            { ...validItem, percent: '1.2' },
            {
                recipient: 'acquiring',
                percent: '0.5',
                category: '123e4567-e89b-12d3-a456-426614174000',
            },
        ]],
        ['empty array', []],
    ]

    const invalidCases = [
        ['not an array', validItem],
        ['missing recipient', [{ percent: '1' }]],
        ['missing percent', [{ recipient: 'organization' }]],
        ['recipient is not a string', [{ ...validItem, recipient: 123 }]],
        ['percent is not a string', [{ ...validItem, percent: 1 }]],
        ['invalid percent format', [{ ...validItem, percent: '-1' }]],
        ['invalid minAmount format', [{ ...validItem, minAmount: 'abc' }]],
        ['invalid maxAmount format', [{ ...validItem, maxAmount: '10.' }]],
        ['additional property', [{ ...validItem, extra: 'unexpected' }]],
    ]

    describe('valid', () => {
        test.each(validCases)('%s', (_, data) => {
            expect(FeeDistributionSchemaJsonValidator(data)).toBe(true)
        })
    })

    describe('invalid', () => {
        test.each(invalidCases)('%s', (_, data) => {
            expect(FeeDistributionSchemaJsonValidator(data)).toBe(false)
        })
    })

    describe('percent,minAmount,maxAmount pattern validation', () => {
        const cases = [
            ['0', true],
            ['1', true],
            ['10', true],
            ['999999', true],
            ['0.1', true],
            ['1.0', true],
            ['10.25', true],
            ['999999.999999', true],

            ['', false],
            [' ', false],
            ['01', false],
            ['001', false],
            ['-1', false],
            ['+1', false],
            ['1.', false],
            ['.5', false],
            ['1.2.3', false],
            ['1,5', false],
            ['abc', false],
            ['1a', false],
            ['a1', false],
        ]

        test.each(cases)('value "%s" -> %s', (value, expected) => {
            const data = [{
                recipient: 'merchant',
                percent: value,
                minAmount: value,
                maxAmount: value,
            }]

            expect(FeeDistributionSchemaJsonValidator(data)).toBe(expected)
        })
    })
})