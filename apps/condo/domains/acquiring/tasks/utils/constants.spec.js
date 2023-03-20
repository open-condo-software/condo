const {
    paginationConfiguration,
} = require('@condo/domains/acquiring/tasks/utils/constants')

describe('recurrent-payments-context constants', () => {
    it('should return proper paginationConfiguration', async () => {
        expect(paginationConfiguration).toHaveProperty('pageSize')
    })
})