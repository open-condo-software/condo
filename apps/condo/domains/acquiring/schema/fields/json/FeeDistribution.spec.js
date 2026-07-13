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

    describe.each([
        ['percent', {
            valid: [
                '0',
                '1',
                '10',
                '99.99',
                '100',
                '100.0',
            ],
            invalid: [
                '',
                ' ',
                '01',
                '001',
                '-1',
                '+1',
                '1.',
                '.5',
                '1.2.3',
                '1,5',
                'abc',
                '1a',
                'a1',
                '100.1',
                '101',
                '999999',
            ],
        }],
        ['minAmount', {
            valid: [
                '0',
                '1',
                '10',
                '999999',
                '0.1',
                '1.0',
                '10.25',
                '999999.999999',
            ],
            invalid: [
                '',
                ' ',
                '01',
                '001',
                '-1',
                '+1',
                '1.',
                '.5',
                '1.2.3',
                '1,5',
                'abc',
                '1a',
                'a1',
            ],
        }],
        ['maxAmount', {
            valid: [
                '0',
                '1',
                '10',
                '999999',
                '0.1',
                '1.0',
                '10.25',
                '999999.999999',
            ],
            invalid: [
                '',
                ' ',
                '01',
                '001',
                '-1',
                '+1',
                '1.',
                '.5',
                '1.2.3',
                '1,5',
                'abc',
                '1a',
                'a1',
            ],
        }],
    ])('%s pattern', (field, { valid, invalid }) => {
        test.each(valid)('accepts "%s"', (value) => {
            const data = [{
                recipient: 'organization',
                percent: '1',
                [field]: value,
            }]

            expect(FeeDistributionSchemaJsonValidator(data)).toBe(true)
        })

        test.each(invalid)('rejects "%s"', (value) => {
            const data = [{
                recipient: 'organization',
                percent: '1',
                [field]: value,
            }]

            expect(FeeDistributionSchemaJsonValidator(data)).toBe(false)
        })
    })
})