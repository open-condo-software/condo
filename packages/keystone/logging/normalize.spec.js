const { normalizeVariables } = require('./normalize')

describe('normalizeVariables', () => {
    afterEach(() => {
        delete process.env.LOG_SENSITIVE_KEYS_OVERRIDE
    })

    it('redacts sensitive keys recursively', () => {
        const input = {
            password: 'secret',
            profile: {
                phone: '+123',
                token: 'keep',
            },
            nested: {
                secrets: {
                    secret: 'hidden',
                },
            },
            list: [
                { phoneNumber: '100' },
                { value: 'ok' },
            ],
        }

        const result = JSON.parse(normalizeVariables(input))

        expect(result.password).toBe('***')
        expect(result.profile.phone).toBe('***')
        expect(result.profile.token).toBe('***')
        expect(result.nested.secrets).toBe('***')
        expect(result.list[0].phoneNumber).toBe('***')
        expect(result.list[1].value).toBe('ok')
    })


    it('supports case-insensitive and trimmed override keys', () => {
        process.env.LOG_SENSITIVE_KEYS_OVERRIDE = ' GROUPEDRECEIPTS ,   ToKeN '

        const input = {
            groupedReceipts: 'visible',
            token: 'visible too',
            receiptToken: 'hidden',
        }

        const result = JSON.parse(normalizeVariables(input))

        expect(result.groupedReceipts).toBe('visible')
        expect(result.token).toBe('visible too')
        expect(result.receiptToken).toBe('***')
    })

    it('does not redact overridden sensitive keys', () => {
        process.env.LOG_SENSITIVE_KEYS_OVERRIDE = 'groupedReceipts, token'

        const input = {
            groupedReceipts: 'visible',
            token: 'visible too',
            receipt: 'hidden',
            nested: {
                groupedReceipts: {
                    id: 'receipt-id',
                },
                token: 'nested visible',
                secret: 'hidden',
            },
        }

        const result = JSON.parse(normalizeVariables(input))

        expect(result.groupedReceipts).toBe('visible')
        expect(result.token).toBe('visible too')
        expect(result.receipt).toBe('***')
        expect(result.nested.groupedReceipts.id).toBe('receipt-id')
        expect(result.nested.token).toBe('nested visible')
        expect(result.nested.secret).toBe('***')
    })
})
