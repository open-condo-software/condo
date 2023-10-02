const {
    paginationConfiguration,
} = require('@condo/domains/acquiring/constants/recurrentPaymentTask')

describe('recurrent-payments-context constants', () => {
    afterAll( () => {
        if (global.gc) {
            global.gc()
        }
    })
    it('should return proper paginationConfiguration', async () => {
        expect(paginationConfiguration).toHaveProperty('pageSize')
    })
})