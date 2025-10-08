describe('clients/index', () => {
    beforeEach(() => {
        // Reset the singleton instance by clearing the module cache
        delete require.cache[require.resolve('./index')]
    })

    afterEach(() => {
        // Reset modules to clear singleton state
        jest.resetModules()
    })

    describe('Basic functionality', () => {
        test('should be a function that accepts clientName parameter', () => {
            const { getCondoClient } = require('./index')
            
            expect(getCondoClient).toBeInstanceOf(Function)
            // Function has default parameter, so length is 0
            expect(getCondoClient).toHaveLength(0)
        })

        test('should return a promise', () => {
            const { getCondoClient } = require('./index')
            
            const result = getCondoClient()
            
            expect(result).toBeInstanceOf(Promise)
            
            // Clean up the promise to avoid unhandled rejection
            result.catch(() => {})
        })

        test('should return the same instance on second call (singleton)', async () => {
            const { getCondoClient } = require('./index')
            
            const firstCall = await getCondoClient()
            const secondCall = await getCondoClient()
            
            expect(firstCall).toBe(secondCall)
        })
    })
})
