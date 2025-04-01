const { validatePluginConfig } = require('./config.utils')

describe('Plugin config utils', () => {
    describe('validatePluginOptions', () => {
        describe('Must bypass valid options', () => {
            const validCases = [
                ['empty config', {}],
                ['queries config', { queries: ['allTickets', '_allTicketsMeta'] }],
                ['mutations config', { mutations: ['createUser', 'updateProperty'] }],
                ['combined config', { queries: ['allTickets', '_allTicketsMeta'], mutations: ['createUser', 'updateProperty'] }],
            ]

            test.each(validCases)('%p', (_, options) => {
                expect(() => validatePluginConfig(options)).not.toThrow()
                const validated = validatePluginConfig(options)
                expect(validated).toEqual(options)
            })
        })
        describe('Must throw error on invalid options', () => {
            const invalidCases = [
                ['config is not object', 123],
                ['config is JSON.stringify object', '{}'],
                ['config with unknown properties', { fields: ['myField'] }],
                ['config with invalid queries #1', { queries: [123] }],
                ['config with invalid queries #2', { queries: 'allTickets' }],
                ['config with invalid mutations #1', { mutations: [123] }],
                ['config with invalid mutations #2', { mutations: 'allTickets' }],
            ]

            test.each(invalidCases)('%p', (_, options) => {
                expect(() => validatePluginConfig(options)).toThrow(/Invalid ApolloQueryBlockingPlugin options provided/)
            })
        })
    })
})