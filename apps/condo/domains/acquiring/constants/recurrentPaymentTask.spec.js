const {
    paginationConfiguration,
} = require('@condo/domains/acquiring/constants/recurrentPaymentTask')

describe('recurrent-payments-context constants', () => {
    it('should return proper paginationConfiguration', async () => {
        expect(paginationConfiguration).toHaveProperty('pageSize')
    })
})