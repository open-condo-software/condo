import { VIEW_TYPES } from '@condo/domains/acquiring/utils/clientSchema'
import {
    getPaymentColumnFilterState,
    getTransferredPaymentFilters,
    mergePaymentColumnFilters,
} from '@condo/domains/acquiring/utils/paymentFilters'


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
            paymentOrder: '1',
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
            order: '1',
            type: ['integration-id'],
        })
    })
})

describe('payment column filters', () => {
    test('selects only filters available in list columns', () => {
        expect(getPaymentColumnFilterState({
            depositedDate: ['2026-11-01', '2026-11-12'],
            transferDate: ['2026-11-02', '2026-11-13'],
            accountNumber: '123',
            address: 'Main street',
            order: '1',
            status: ['DONE'],
            type: ['integration-id'],
        }, VIEW_TYPES.list)).toEqual({
            depositedDate: ['2026-11-01', '2026-11-12'],
            transferDate: ['2026-11-02', '2026-11-13'],
            accountNumber: '123',
            address: 'Main street',
            order: '1',
            status: ['DONE'],
            type: ['integration-id'],
        })
    })

    test('replaces registry column filters and preserves non-column filters', () => {
        expect(mergePaymentColumnFilters({
            paymentPeriod: ['2026-11-01', '2026-11-12'],
            loadedAt: ['2026-11-02', '2026-11-13'],
            paymentOrder: 'old',
            status: ['NEW'],
            type: ['old-integration'],
        }, {
            paymentPeriod: ['2026-11-03', '2026-11-10'],
            paymentOrder: 'new',
            type: ['new-integration'],
        }, VIEW_TYPES.registry)).toEqual({
            paymentPeriod: ['2026-11-03', '2026-11-10'],
            paymentOrder: 'new',
            type: ['new-integration'],
        })
    })
})
