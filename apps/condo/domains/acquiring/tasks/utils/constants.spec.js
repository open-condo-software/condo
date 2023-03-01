const {
    dvAndSender,
    paginationConfiguration,
} = require('@condo/domains/acquiring/tasks/utils/constants')

describe('recurrent-payments-context constants ', () => {
    it('should return proper dvAndSender', async () => {
        expect(dvAndSender).toHaveProperty('dv')
        expect(dvAndSender).toHaveProperty('sender')
        expect(dvAndSender.sender).toHaveProperty('dv')
        expect(dvAndSender.sender).toHaveProperty('fingerprint')
    })

    it('should return proper paginationConfiguration', async () => {
        expect(paginationConfiguration).toHaveProperty('pageSize')
    })
})