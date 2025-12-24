const { EVENT_TYPE_PATTERN, validateEventType } = require('./validation')

describe('validateEventType', () => {
    describe('valid event types', () => {
        const validCases = [
            'payment.created',
            'payment.status.changed',
            'invoice.paid',
            'user.deleted',
            'order.item.added',
            'a.b',
            'resource1.action2',
            'my-resource.my-action',
            'payment.status-change.completed',
            'Payment.Created',
            'myResource.myAction',
        ]

        test.each(validCases)('should accept valid event type: %s', (eventType) => {
            const result = validateEventType(eventType)
            expect(result.isValid).toBe(true)
            expect(result.error).toBeUndefined()
        })
    })

    describe('invalid event types', () => {
        test('should reject non-string values', () => {
            expect(validateEventType(123).isValid).toBe(false)
            expect(validateEventType(null).isValid).toBe(false)
            expect(validateEventType(undefined).isValid).toBe(false)
            expect(validateEventType({}).isValid).toBe(false)
        })

        test('should reject strings shorter than 3 characters', () => {
            const result = validateEventType('a.b')
            // 'a.b' is exactly 3 chars, should be valid
            expect(result.isValid).toBe(true)

            const result2 = validateEventType('ab')
            expect(result2.isValid).toBe(false)
            expect(result2.error).toContain('at least 3 characters')
        })

        test('should reject strings longer than 255 characters', () => {
            const longEventType = 'a.' + 'b'.repeat(254)
            const result = validateEventType(longEventType)
            expect(result.isValid).toBe(false)
            expect(result.error).toContain('not exceed 255 characters')
        })

        test('should reject event types without dots', () => {
            const result = validateEventType('paymentcreated')
            expect(result.isValid).toBe(false)
            expect(result.error).toContain('dot-notation format')
        })

        test('should reject event types starting with a number', () => {
            const result = validateEventType('1payment.created')
            expect(result.isValid).toBe(false)
            expect(result.error).toContain('dot-notation format')
        })

        test('should reject event types with special characters', () => {
            expect(validateEventType('payment@created').isValid).toBe(false)
            expect(validateEventType('payment.cre_ated').isValid).toBe(false)
            expect(validateEventType('payment..created').isValid).toBe(false)
            expect(validateEventType('.payment.created').isValid).toBe(false)
            expect(validateEventType('payment.created.').isValid).toBe(false)
        })

        test('should reject event types with spaces', () => {
            const result = validateEventType('payment .created')
            expect(result.isValid).toBe(false)
        })

        test('should reject single segment (no action)', () => {
            const result = validateEventType('payment')
            expect(result.isValid).toBe(false)
            expect(result.error).toContain('dot-notation format')
        })
    })
})

describe('EVENT_TYPE_PATTERN', () => {
    test('should be a valid regex', () => {
        expect(EVENT_TYPE_PATTERN).toBeInstanceOf(RegExp)
    })

    test('should match valid patterns', () => {
        expect(EVENT_TYPE_PATTERN.test('payment.created')).toBe(true)
        expect(EVENT_TYPE_PATTERN.test('payment.status.changed')).toBe(true)
        expect(EVENT_TYPE_PATTERN.test('a.b.c.d.e')).toBe(true)
    })

    test('should match camelCase patterns', () => {
        expect(EVENT_TYPE_PATTERN.test('Payment.Created')).toBe(true)
        expect(EVENT_TYPE_PATTERN.test('myResource.myAction')).toBe(true)
    })

    test('should not match invalid patterns', () => {
        expect(EVENT_TYPE_PATTERN.test('payment')).toBe(false)
        expect(EVENT_TYPE_PATTERN.test('1.2')).toBe(false)
    })
})
