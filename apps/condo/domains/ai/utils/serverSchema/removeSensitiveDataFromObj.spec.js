const { removeSensitiveDataFromObj, restoreSensitiveData } = require('./removeSensitiveDataFromObj')

describe('removeSensitiveDataFromObj', () => {
    it('should mask PII while preserving other data', () => {
        const now = new Date()
        const input = {
            emails: [
                'user@example.com',
                'user.name+tag@sub.domain.com',
                'UPPERCASE@DOMAIN.COM',
            ],
            phones: [
                '+1 (555) 123-4567',
                '555-123-4567',
                '+15551234567',
                '18001238431',
                '388001238431',
                '1388001238431',
            ],
            mixedContent: 'Contact me at user@example.com or +1 (555) 123-4567',
            
            dates: {
                iso: now.toISOString(),
                timestamp: now.getTime(),
                date: '2023-12-31',
                time: '23:59:59',
            },
            numbers: {
                int: 42,
                float: 3.14,
                stringNum: '12345',
                phoneLike: '12345678',  // Likely not a phone number
                longNumber: '12345678901234567890',
            },
            urls: ['https://example.com', 'www.test.com'],
            booleans: [true, false, 'true', 'false'],
            nullish: [null, undefined, ''],
            special: [
                '123 Main St',
                'Version 1.2.3',
                'Meeting at 3 PM',
                'Order #12345',
            ],
        }

        const { cleaned, replacements } = removeSensitiveDataFromObj(input)

        input.emails.forEach(email => {
            expect(JSON.stringify(cleaned)).toContain('<email')
            expect(Object.values(replacements)).toContain(email)
        })
        
        input.phones.forEach(phone => {
            expect(JSON.stringify(cleaned)).toContain('<phone')
            expect(Object.values(replacements)).toContain(phone)
        })

        expect(cleaned.mixedContent).toMatch(/<email\d+>.*<phone\d+/)

        expect(cleaned.dates).toEqual(input.dates)
        expect(cleaned.numbers).toEqual(input.numbers)
        expect(cleaned.urls).toEqual(input.urls)
        expect(cleaned.booleans).toEqual(input.booleans)
        expect(cleaned.nullish).toEqual(input.nullish)

        cleaned.special.forEach((str, i) => {
            expect(str).toBe(input.special[i])
            expect(str).not.toMatch(/<[a-z]+\d+>/)
        })
    })

    it('should handle nested objects and arrays', () => {
        const input = {
            user: {
                name: 'John Smith',
                email: 'john@example.com',
                phone: '+1-555-123-4567',
                contacts: [
                    { type: 'email', value: 'work@example.com' },
                    { type: 'phone', value: '+1-555-987-6543' },
                ],
            },
            message: 'Contact at john@example.com or +1-555-123-4567',
        }

        const { cleaned, replacements } = removeSensitiveDataFromObj(input)
        
        // Verify structure is preserved
        expect(cleaned.user.name).toBe('John Smith')
        expect(cleaned.user.contacts).toHaveLength(2)
        
        // Verify PII was replaced
        expect(cleaned.user.email).toMatch(/^<email\d+>$/)
        expect(cleaned.user.phone).toMatch(/^<phone\d+>$/)
        expect(cleaned.message).toMatch(/<email\d+>.*<phone\d+>/)
        
        // Verify replacements are correct
        expect(Object.values(replacements)).toContain('john@example.com')
        expect(Object.values(replacements)).toContain('+1-555-123-4567')
        expect(Object.values(replacements)).toContain('work@example.com')
        expect(Object.values(replacements)).toContain('+1-555-987-6543')
    })

    it('should skip circular references', () => {
        const obj = { 
            name: 'Test',
            email: 'test@example.com',
            self: null,
        }
        obj.self = obj  // Create circular reference
        
        const { cleaned } = removeSensitiveDataFromObj({ user: obj })
        
        expect(cleaned.user).toBeDefined()
        expect(cleaned.user.name).toBe('Test')
        expect(cleaned.user.email).toMatch(/^<email\d+>$/)
        expect(cleaned.user.self).toBeUndefined()
    })

})

describe('restoreSensitiveData', () => {
    it('should restore PII data from placeholders', () => {
        const sanitized = {
            user: {
                name: 'John Smith',
                email: '<email1>',
                phone: '<phone1>',
            },
            message: 'Contact at <email1> or <phone1>',
        }

        const replacements = {
            '<email1>': 'john@example.com',
            '<phone1>': '+1-555-123-4567',
        }

        const result = restoreSensitiveData(sanitized, replacements)
        
        expect(result.user.email).toBe('john@example.com')
        expect(result.user.phone).toBe('+1-555-123-4567')
        expect(result.message).toBe('Contact at john@example.com or +1-555-123-4567')
        expect(result.user.name).toBe('John Smith')
    })
})

describe('integration', () => {
    it('should sanitize and restore an object with PII', () => {
        const original = {
            user: {
                name: 'John Doe',
                email: 'john@example.com',
                phone: '+1-555-123-4567',
            },
            message: 'Contact at john@example.com or +1-555-123-4567',
        }

        const { cleaned, replacements } = removeSensitiveDataFromObj(original)
        const restored = restoreSensitiveData(cleaned, replacements)
        
        expect(restored).toEqual(original)
    })
})
