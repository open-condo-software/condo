import { VIEW_TYPES } from '@condo/domains/acquiring/utils/clientSchema'
import { getTransferredPaymentFilters } from '@condo/domains/acquiring/utils/paymentFilters'


describe('getTransferredPaymentFilters', () => {
    test('transfers common list filters to registry filters', () => {
        const result = getTransferredPaymentFilters({
            search: 'query',
            depositedDate: ['2026-11-01', '2026-11-12'],
            transferDate: ['2026-11-02', '2026-11-13'],
            order: ['1', '2'],
            type: ['integration-id'],
            status: ['DONE'],
            accountNumber: '123',
            address: 'Main street',
        }, VIEW_TYPES.list, VIEW_TYPES.registry)

        expect(result).toEqual({
            search: 'query',
            paymentPeriod: ['2026-11-01', '2026-11-12'],
            loadedAt: ['2026-11-02', '2026-11-13'],
            paymentOrder: ['1', '2'],
            type: ['integration-id'],
        })
    })

    test('transfers common registry filters to list filters', () => {
        const result = getTransferredPaymentFilters({
            search: 'query',
            paymentPeriod: ['2026-11-01', '2026-11-12'],
            loadedAt: ['2026-11-02', '2026-11-13'],
            paymentOrder: ['1', '2'],
            type: ['integration-id'],
            status: ['NEW'],
        }, VIEW_TYPES.registry, VIEW_TYPES.list)

        expect(result).toEqual({
            search: 'query',
            depositedDate: ['2026-11-01', '2026-11-12'],
            transferDate: ['2026-11-02', '2026-11-13'],
            order: ['1', '2'],
            type: ['integration-id'],
        })
    })
})
