import { BillingIntegrationOrganizationContext, PaymentWhereInput } from '@app/condo/schema'
import { searchAcquiringIntegration, searchBillingProperty } from '@condo/domains/acquiring/utils/clientSchema/search'
import {
    ComponentType,
    convertToOptions,
    FilterComponentSize,
    FiltersMeta,
} from '@condo/domains/common/utils/filters.utils'
import { getDayRangeFilter, getFilter, getStringContainsFilter } from '@condo/domains/common/utils/tables.utils'
import { useIntl } from '@core/next/intl'
import { get } from 'lodash'
import { useMemo } from 'react'
import { PAYMENT_DONE_STATUS, PAYMENT_WITHDRAWN_STATUS } from '@condo/domains/acquiring/constants/payment'

const addressFilter = getStringContainsFilter(['receipt', 'property', 'address'])
const accountFilter = getStringContainsFilter(['accountNumber'])
const typeFilter = getStringContainsFilter(['context', 'integration', 'name'])
const transactionFilter = getStringContainsFilter(['multiPayment', 'transactionId'])
const dateFilter = getDayRangeFilter('advancedAt')
const propertyFilter = getFilter(['receipt', 'property', 'id'], 'array', 'string', 'in')
const acquiringContextFilter = getFilter(['context', 'id'], 'array', 'string', 'in')
const statusFilter = getFilter('status', 'array', 'string', 'in')

const statusType = [PAYMENT_WITHDRAWN_STATUS, PAYMENT_DONE_STATUS]

export function usePaymentsTableFilters (
    billingContext: BillingIntegrationOrganizationContext,
    organizationId: string,
): FiltersMeta<PaymentWhereInput>[] {
    const intl = useIntl()
    const StartDateMessage = intl.formatMessage({ id: 'pages.condo.meter.StartDate' })
    const EndDateMessage = intl.formatMessage({ id: 'pages.condo.meter.EndDate' })
    const DateMessage = intl.formatMessage({ id: 'CreatedDate' })
    const accountTitle = intl.formatMessage({ id: 'field.AccountNumberShort' })
    const addressMessage = intl.formatMessage({ id: 'pages.condo.payments.billingAddress' })
    const enterAddressMessage = intl.formatMessage({ id: 'pages.condo.payments.enterBillingAddress' })
    const typeMessage = intl.formatMessage({ id: 'pages.condo.payments.type' })
    const enterTypeMessage = intl.formatMessage({ id: 'pages.condo.payments.enterType' })
    const statusTitle = intl.formatMessage({ id: 'Status' })
    const enterStatusMessage = intl.formatMessage({ id: 'pages.condo.payments.enterStatus' })

    const statuses = statusType.map((item) => ({
        name: intl.formatMessage({ id: 'payment.status.' + item }),
        id: item,
    }))
    const statusOptions = convertToOptions(statuses, 'name', 'id')

    return useMemo(() => {
        return [
            {
                keyword: 'search',
                filters: [addressFilter, accountFilter, typeFilter, transactionFilter, dateFilter],
                combineType: 'OR',
            },
            {
                keyword: 'advancedAt',
                filters: [dateFilter],
                component: {
                    type: ComponentType.DateRange,
                    props: {
                        placeholder: [StartDateMessage, EndDateMessage],
                    },
                    modalFilterComponentWrapper: {
                        label: DateMessage,
                        size: FilterComponentSize.Medium,
                    },
                },
            },
            {
                keyword: 'accountNumber',
                filters: [accountFilter],
                component: {
                    type: ComponentType.Input,
                    modalFilterComponentWrapper: {
                        label: accountTitle,
                        size: FilterComponentSize.Medium,
                    },
                },
            },
            {
                keyword: 'address',
                filters: [propertyFilter],
                component: {
                    type: ComponentType.GQLSelect,
                    props: {
                        search: searchBillingProperty(billingContext),
                        mode: 'multiple',
                        showArrow: true,
                        placeholder: enterAddressMessage,
                        infinityScroll: true,
                    },
                    modalFilterComponentWrapper: {
                        label: addressMessage,
                        size: FilterComponentSize.Large,
                    },
                },
            },
            {
                keyword: 'type',
                filters: [acquiringContextFilter],
                component: {
                    type: ComponentType.GQLSelect,
                    props: {
                        search: searchAcquiringIntegration(organizationId),
                        mode: 'multiple',
                        showArrow: true,
                        placeholder: enterTypeMessage,
                        infinityScroll: true,
                    },
                    modalFilterComponentWrapper: {
                        label: typeMessage,
                        size: FilterComponentSize.Large,
                    },
                },
            },
            {
                keyword: 'status',
                filters: [statusFilter],
                component: {
                    type: ComponentType.Select,
                    options: statusOptions,
                    props: {
                        mode: 'multiple',
                        showArrow: true,
                        placeholder: enterStatusMessage,
                    },
                    modalFilterComponentWrapper: {
                        label: statusTitle,
                        size: FilterComponentSize.Large,
                    },
                },
            },
        ]
    }, [get(billingContext, 'id', null), organizationId])
}
