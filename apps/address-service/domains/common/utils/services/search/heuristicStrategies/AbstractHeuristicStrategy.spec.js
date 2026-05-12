const { AbstractHeuristicStrategy } = require('@address-service/domains/common/utils/services/search/heuristicStrategies/AbstractHeuristicStrategy')

describe('AbstractHeuristicStrategy', () => {
    it('sets type from constructor', () => {
        const strategy = new class extends AbstractHeuristicStrategy {}('fias_id')
        expect(strategy.type).toBe('fias_id')
    })

    it('throws when constructed without type', () => {
        expect(() => new class extends AbstractHeuristicStrategy {}()).toThrow('type is required')
    })
})
