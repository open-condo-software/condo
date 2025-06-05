const { validatePluginOptions } = require('./config.utils')

describe('Plugin config utils', () => {
    describe('validatePluginOptions', () => {
        describe('Must bypass valid options', () => {
            const validCases = [
                ['empty config', {}],
                ['query-override config', { queryLengthLimit: 4096 }],
                ['variables-override config', { variablesSizeLimit: 1024 * 50 }],
                ['full config', { queryLengthLimit: 2048, variablesSizeLimit: 1024 }],
            ]

            test.each(validCases)('%p', (_, options) => {
                expect(() => validatePluginOptions(options)).not.toThrow()
                const validated = validatePluginOptions(options)
                expect(validated).toEqual(options)
            })
        })
        describe('Must throw error on invalid options', () => {
            const invalidCases = [
                ['non-object value', 'foobar'],
                ['queryLengthLimit is not number', { queryLengthLimit: '10000' }],
                ['variablesSizeLimit is not number', { variablesSizeLimit: '10000' }],
                ['unknown properties provided', { mutationSizeLimit: 50 }],
            ]

            test.each(invalidCases)('%p', (_, options) => {
                expect(() => validatePluginOptions(options)).toThrow(/Invalid ApolloRequestLimitingPlugin options provided/)
            })
        })
    })
})