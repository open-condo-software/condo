const { normalizeVariables } = require('./normalize')

describe('normalizeVariables', () => {
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
})
