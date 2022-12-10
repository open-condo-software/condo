import { BillingIntegrationOrganizationContext, PaymentWhereInput } from '@app/condo/schema'
import { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { PAYMENT_DONE_STATUS, PAYMENT_WITHDRAWN_STATUS } from '@condo/domains/acquiring/constants/payment'
import { searchAcquiringIntegration, searchBillingProperty } from '@condo/domains/acquiring/utils/clientSchema/search'
import {
    ComponentType,
    convertToOptions,
    FilterComponentSize,
    FiltersMeta,
} from '@condo/domains/common/utils/filters.utils'
import { getDayRangeFilter, getFilter, getStringContainsFilter } from '@condo/domains/common/utils/tables.utils'


const addressFilter = getStringContainsFilter(['receipt', 'property', 'address'])
const accountFilter = getStringContainsFilter(['accountNumber'])
const typeFilter = getStringContainsFilter(['context', 'integration', 'name'])
const transactionFilter = getStringContainsFilter(['multiPayment', 'transactionId'])
const dateFilter = getDayRangeFilter('advancedAt')
const propertyFilter = getFilter(['receipt', 'property', 'id'], 'array', 'string', 'in')
const acquiringContextFilter = getFilter(['context', 'id'], 'array', 'string', 'in')
const statusFilter = getFilter('status', 'array', 'string', 'in')
const orderFilter = getFilter('order', 'array', 'string', 'in')

const statusType = [PAYMENT_WITHDRAWN_STATUS, PAYMENT_DONE_STATUS]

export function usePaymentsTableFilters (
    billingContext: BillingIntegrationOrganizationContext,
    organizationId: string,
): FiltersMeta<PaymentWhereInput>[] {
    const intl = useIntl()
    const StartDateMessage = intl.formatMessage({ id: 'meter.StartDate' })
    const EndDateMessage = intl.formatMessage({ id: 'meter.EndDate' })
    const DateMessage = intl.formatMessage({ id: 'CreatedDate' })
    const AccountTitle = intl.formatMessage({ id: 'field.AccountNumberShort' })
    const AddressMessage = intl.formatMessage({ id: 'payments.billingAddress' })
    const EnterAddressMessage = intl.formatMessage({ id: 'payments.enterBillingAddress' })
    const TypeMessage = intl.formatMessage({ id: 'payments.type' })
    const EnterTypeMessage = intl.formatMessage({ id: 'payments.enterType' })
    const StatusTitle = intl.formatMessage({ id: 'Status' })
    const PaymentOrderTitle = intl.formatMessage({ id: 'PaymentOrder' })
    const EnterStatusMessage = intl.formatMessage({ id: 'payments.enterStatus' })

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
                        label: AccountTitle,
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
                        placeholder: EnterAddressMessage,
                        infinityScroll: true,
                    },
                    modalFilterComponentWrapper: {
                        label: AddressMessage,
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
                        placeholder: EnterTypeMessage,
                        infinityScroll: true,
                    },
                    modalFilterComponentWrapper: {
                        label: TypeMessage,
                        size: FilterComponentSize.Large,
                    },
                },
            },
            {
                keyword: 'order',
                filters: [orderFilter],
                component: {
                    type: ComponentType.Input,
                    modalFilterComponentWrapper: {
                        label: PaymentOrderTitle,
                        size: FilterComponentSize.Medium,
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
                        placeholder: EnterStatusMessage,
                    },
                    modalFilterComponentWrapper: {
                        label: StatusTitle,
                        size: FilterComponentSize.Medium,
                    },
                },
            },
        ]
    }, [
        AccountTitle, AddressMessage,
        DateMessage, EndDateMessage,
        EnterAddressMessage, EnterStatusMessage,
        EnterTypeMessage, PaymentOrderTitle,
        StartDateMessage, StatusTitle,
        TypeMessage, billingContext,
        organizationId, statusOptions,
    ])

}
