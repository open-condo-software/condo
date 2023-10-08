import { useMemo } from 'react'

import {
    getDayRangeFilter,
    getStringContainsFilter,
} from '@condo/domains/common/utils/tables.utils'

import type {
    BankTransactionWhereInput,
    BankTransaction,
    BankContractorAccount,
    BankContractorAccountWhereInput,
} from '@app/condo/schema'
import type { FiltersMeta } from '@condo/domains/common/utils/filters.utils'

const dateFilter = getDayRangeFilter('date')
const filterNumber = getStringContainsFilter('number')
const filterBankAccountNumber = getStringContainsFilter(['account', 'number'])
const filterPurpose = getStringContainsFilter('purpose')
const filterTin = getStringContainsFilter('tin')
const filterContractorName = getStringContainsFilter('name')

export function useBankTransactionTableFilters (): Array<FiltersMeta<BankTransactionWhereInput, BankTransaction>> {

    return useMemo(() => {
        return [
            {
                keyword: 'search',
                filters: [
                    dateFilter,
                    filterNumber,
                    filterBankAccountNumber,
                    filterPurpose,
                ],
                combineType: 'OR',
            },
            {
                keyword: 'date',
                filters: [dateFilter],
            },
        ]
    }, [])
}

export function useBankContractorAccountTableFilters (): Array<FiltersMeta<BankContractorAccountWhereInput, BankContractorAccount>> {
    return useMemo(() => {
        return [
            {
                keyword: 'search',
                filters: [
                    filterNumber,
                    filterTin,
                    filterContractorName,
                ],
                combineType: 'OR',
            },
        ]
    }, [])
}
