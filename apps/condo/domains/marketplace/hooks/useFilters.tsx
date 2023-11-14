import {
    MeterReadingWhereInput,
    MeterReadingSource as MeterReadingSourceType,
    MeterResource as MeterResourceType,
    PaymentWhereInput,
} from '@app/condo/schema'
import compact from 'lodash/compact'
import get from 'lodash/get'
import { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import {
    FiltersMeta,
} from '@condo/domains/common/utils/filters.utils'
import {
    getDayRangeFilter,
    getStringContainsFilter,
} from '@condo/domains/common/utils/tables.utils'
import { MARKETPLACE_PAGE_TYPES, MarketplacePageTypes } from '@condo/domains/marketplace/utils/clientSchema'


const addressStringContainsFilter = getStringContainsFilter(['invoice', 'property', 'address'])
const invoiceNumberFilter = getStringContainsFilter(['invoice', 'number'])
const ticketNumberFilter = getStringContainsFilter(['invoice', 'ticket', 'number'])
const statusFilter = getStringContainsFilter('status')
const paymentDateRangeFilter = getDayRangeFilter('date')

export function useFilters (marketplacePageType: MarketplacePageTypes): Array<FiltersMeta<PaymentWhereInput>>  {
    const intl = useIntl()

    const userOrganization = useOrganization()
    const userOrganizationId = get(userOrganization, ['organization', 'id'])


    return useMemo(() => {
        switch (marketplacePageType) {
            case MARKETPLACE_PAGE_TYPES.payments: {
                return [
                    {
                        keyword: 'search',
                        filters: [paymentDateRangeFilter, statusFilter, ticketNumberFilter, invoiceNumberFilter],
                        combineType: 'OR',
                    },
                ]
            }
            default: {
                return compact([
                    {
                        keyword: 'search',
                        filters:[
                            addressStringContainsFilter,
                        ],
                        combineType: 'OR',
                    },
                ])
            }
        }

    }, [marketplacePageType, userOrganizationId])
}