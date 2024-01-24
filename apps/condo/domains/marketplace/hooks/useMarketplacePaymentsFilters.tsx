import {
    PaymentWhereInput,
} from '@app/condo/schema'
import { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { PAYMENT_DONE_STATUS, PAYMENT_WITHDRAWN_STATUS } from '@condo/domains/acquiring/constants/payment'
import {
    ComponentType,
    FiltersMeta,
} from '@condo/domains/common/utils/filters.utils'
import {
    getDayRangeFilter, getFilter, getNumberFilter,
} from '@condo/domains/common/utils/tables.utils'


const invoiceNumberFilter = getNumberFilter(['invoice', 'number'])
const ticketNumberFilter = getNumberFilter(['invoice', 'ticket', 'number'])
const paymentDateRangeFilter = getDayRangeFilter('createdAt')
const statusFilter = getFilter('status', 'array', 'string', 'in')
const createdAtRangeFilter = getDayRangeFilter('createdAt')

const STATUS_TYPES = [PAYMENT_WITHDRAWN_STATUS, PAYMENT_DONE_STATUS]

export function useMarketplacePaymentsFilters (): Array<FiltersMeta<PaymentWhereInput>>  {
    const intl = useIntl()
    const EnterStatusMessage = intl.formatMessage({ id: 'pages.condo.payments.enterStatus' })
    const StartDateMessage = intl.formatMessage({ id: 'pages.condo.meter.StartDate' })
    const EndDateMessage = intl.formatMessage({ id: 'pages.condo.meter.EndDate' })

    const statusOptions = useMemo(() => STATUS_TYPES.map(status => ({
        label: intl.formatMessage({ id: `payment.status.${status}` }),
        value: status,
    })), [intl])

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
                },
            },
            {
                keyword: 'createdAt',
                filters: [createdAtRangeFilter],
                component: {
                    type: ComponentType.DateRange,
                    props: {
                        placeholder: [StartDateMessage, EndDateMessage],
                    },
                },
            },
            {
                keyword: 'search',
                filters: [paymentDateRangeFilter, ticketNumberFilter, invoiceNumberFilter],
                combineType: 'OR',
            },
        ]

    }, [EnterStatusMessage, statusOptions, StartDateMessage, EndDateMessage])
}