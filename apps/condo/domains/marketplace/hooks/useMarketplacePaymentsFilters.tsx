import {
    PaymentWhereInput,
} from '@app/condo/schema'
import get from 'lodash/get'
import { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import { PAYMENT_DONE_STATUS, PAYMENT_WITHDRAWN_STATUS } from '@condo/domains/acquiring/constants/payment'
import {
    ComponentType,
    convertToOptions, FilterComponentSize,
    FiltersMeta,
} from '@condo/domains/common/utils/filters.utils'
import {
    getDayRangeFilter, getFilter,
    getStringContainsFilter,
} from '@condo/domains/common/utils/tables.utils'


const invoiceNumberFilter = getStringContainsFilter(['invoice', 'number'])
const ticketNumberFilter = getStringContainsFilter(['invoice', 'ticket', 'number'])
const amount = getStringContainsFilter('amount')
const paymentDateRangeFilter = getDayRangeFilter('createdAt')
const statusFilter = getFilter('status', 'array', 'string', 'in')

const statusType = [PAYMENT_WITHDRAWN_STATUS, PAYMENT_DONE_STATUS]

export function useMarketplacePaymentsFilters (): Array<FiltersMeta<PaymentWhereInput>>  {
    const intl = useIntl()
    const EnterStatusMessage = intl.formatMessage({ id: 'pages.condo.payments.enterStatus' })
    const StatusTitle = intl.formatMessage({ id: 'Status' })

    const userOrganization = useOrganization()
    const userOrganizationId = get(userOrganization, ['organization', 'id'])

    const statuses = statusType.map((item) => ({
        name: intl.formatMessage({ id: 'payment.status.' + item }),
        id: item,
    }))
    const statusOptions = convertToOptions(statuses, 'name', 'id')

    return useMemo(() => {
        return [
            {
                keyword: 'status',
                filters: [statusFilter],
                component: {
                    type: ComponentType.Select,
                    options: statusOptions,
                    props: {
                        mode: 'multiple',
                        showArrow: true,
                        placeholder: EnterStatusMessage,
                    },
                    modalFilterComponentWrapper: {
                        label: StatusTitle,
                        size: FilterComponentSize.Medium,
                    },
                },
            },
            {
                keyword: 'search',
                filters: [paymentDateRangeFilter, ticketNumberFilter, invoiceNumberFilter, amount],
                combineType: 'OR',
            },
        ]

    }, [userOrganizationId, EnterStatusMessage, StatusTitle, statusOptions])
}