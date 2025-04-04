import { PaymentWhereInput } from '@app/condo/schema'
import { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { PAYMENT_DONE_STATUS, PAYMENT_WITHDRAWN_STATUS } from '@condo/domains/acquiring/constants/payment'
import { searchAcquiringIntegration } from '@condo/domains/acquiring/utils/clientSchema/search'
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
const depositedDateFilter = getDayRangeFilter('depositedDate')
const transferDateFilter = getDayRangeFilter('transferDate')
const propertyFilter = getStringContainsFilter(['rawAddress'])
const acquiringContextFilter = getFilter(['context', 'id'], 'array', 'string', 'in')
const statusFilter = getFilter('status', 'array', 'string', 'in')
const orderFilter = getFilter('order', 'array', 'string', 'in')

const statusType = [PAYMENT_WITHDRAWN_STATUS, PAYMENT_DONE_STATUS]

export function usePaymentsTableFilters (
    organizationId: string,
): FiltersMeta<PaymentWhereInput>[] {
    const intl = useIntl()
    const StartDateMessage = intl.formatMessage({ id: 'pages.condo.meter.StartDate' })
    const EndDateMessage = intl.formatMessage({ id: 'pages.condo.meter.EndDate' })
    const DepositedDateMessage = intl.formatMessage({ id: 'DepositedDate' })
    const TransferDateMessage = intl.formatMessage({ id: 'TransferDate' })
    const AccountTitle = intl.formatMessage({ id: 'field.AccountNumberShort' })
    const AddressMessage = intl.formatMessage({ id: 'pages.condo.payments.billingAddress' })
    const EnterAddressMessage = intl.formatMessage({ id: 'pages.condo.payments.enterBillingAddress' })
    const TypeMessage = intl.formatMessage({ id: 'pages.condo.payments.type' })
    const EnterTypeMessage = intl.formatMessage({ id: 'pages.condo.payments.enterType' })
    const StatusTitle = intl.formatMessage({ id: 'Status' })
    const PaymentOrderTitle = intl.formatMessage({ id: 'PaymentOrder' })
    const EnterStatusMessage = intl.formatMessage({ id: 'pages.condo.payments.enterStatus' })

    const statuses = statusType.map((item) => ({
        name: intl.formatMessage({ id: 'payment.status.' + item as FormatjsIntl.Message['ids'] }),
        id: item,
    }))
    const statusOptions = convertToOptions(statuses, 'name', 'id')

    return useMemo(() => {
        return [
            {
                keyword: 'search',
                filters: [addressFilter, accountFilter, typeFilter, transactionFilter, depositedDateFilter, transferDateFilter],
                combineType: 'OR',
            },
            {
                keyword: 'depositedDate',
                filters: [depositedDateFilter],
                component: {
                    type: ComponentType.DateRange,
                    props: {
                        placeholder: [StartDateMessage, EndDateMessage],
                    },
                    modalFilterComponentWrapper: {
                        label: DepositedDateMessage,
                        size: FilterComponentSize.Medium,
                    },
                },
            },
            {
                keyword: 'transferDate',
                filters: [transferDateFilter],
                component: {
                    type: ComponentType.DateRange,
                    props: {
                        placeholder: [StartDateMessage, EndDateMessage],
                    },
                    modalFilterComponentWrapper: {
                        label: TransferDateMessage,
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
                        size: FilterComponentSize.Medium,
                    },
                },
            },
            {
                keyword: 'address',
                filters: [propertyFilter],
                component: {
                    type: ComponentType.Input,
                    modalFilterComponentWrapper: {
                        label: AddressMessage,
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
        DepositedDateMessage, TransferDateMessage, EndDateMessage,
        EnterAddressMessage, EnterStatusMessage,
        EnterTypeMessage, PaymentOrderTitle,
        StartDateMessage, StatusTitle,
        TypeMessage,
        organizationId, statusOptions,
    ])

}
