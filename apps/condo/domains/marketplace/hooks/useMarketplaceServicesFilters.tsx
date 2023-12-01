import {
    PaymentWhereInput,
} from '@app/condo/schema'
import get from 'lodash/get'
import { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import {
    FiltersMeta,
} from '@condo/domains/common/utils/filters.utils'
import {
    getStringContainsFilter,
} from '@condo/domains/common/utils/tables.utils'


const skuFilter = getStringContainsFilter(['sku'])
const nameFilter = getStringContainsFilter(['name'])


export function useMarketplaceServicesFilters (): Array<FiltersMeta<PaymentWhereInput>>  {
    const intl = useIntl()
    const EnterStatusMessage = intl.formatMessage({ id: 'pages.condo.payments.enterStatus' })
    const StatusTitle = intl.formatMessage({ id: 'Status' })

    const userOrganization = useOrganization()
    const userOrganizationId = get(userOrganization, ['organization', 'id'])

    return useMemo(() => {
        return [
            {
                keyword: 'search',
                filters: [skuFilter, nameFilter],
                combineType: 'OR',
            },
        ]

    }, [userOrganizationId, EnterStatusMessage, StatusTitle])
}