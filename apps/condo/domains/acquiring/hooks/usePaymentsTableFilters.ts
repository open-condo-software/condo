import { AcquiringIntegrationContext, PaymentWhereInput } from '@app/condo/schema'
import { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { PAYMENT_DONE_STATUS, PAYMENT_WITHDRAWN_STATUS } from '@condo/domains/acquiring/constants/payment'
import {
    ComponentType,
    convertToOptions,
    FilterComponentSize,
    FiltersMeta,
} from '@condo/domains/common/utils/filters.utils'
import { FilterType, getDayRangeFilter, getFilter, getStringContainsFilter } from '@condo/domains/common/utils/tables.utils'


const addressFilter = getStringContainsFilter(['receipt', 'property', 'address'])
const accountFilter = getStringContainsFilter(['accountNumber'])
const depositedDateFilter = getDayRangeFilter('depositedDate')
const transferDateFilter = getDayRangeFilter('transferDate')
const propertyFilter = getStringContainsFilter(['rawAddress'])
const acquiringContextFilter = getFilter(['context', 'id'], 'array', 'string', 'in')
const statusFilter = getFilter('status', 'array', 'string', 'in')
const orderContainsFilter = getStringContainsFilter('order')
const orderFilter: FilterType = (value) => orderContainsFilter(Array.isArray(value) ? value[0] : value)

const statusType = [PAYMENT_WITHDRAWN_STATUS, PAYMENT_DONE_STATUS]

export function usePaymentsTableFilters (
    acquiringContexts: AcquiringIntegrationContext[],
): FiltersMeta<PaymentWhereInput>[] {
    const intl = useIntl()
    const StartDateMessage = intl.formatMessage({ id: 'pages.condo.meter.StartDate' })
    const EndDateMessage = intl.formatMessage({ id: 'pages.condo.meter.EndDate' })
    const DepositedDateMessage = intl.formatMessage({ id: 'DepositedDate' })
    const TransferDateMessage = intl.formatMessage({ id: 'TransferDate' })
    const AccountTitle = intl.formatMessage({ id: 'field.AccountNumberShort' })
    const AddressMessage = intl.formatMessage({ id: 'pages.condo.payments.billingAddress' })
    const SourceMessage = intl.formatMessage({ id: 'field.Source' })
    const EnterSourceMessage = intl.formatMessage({ id: 'pages.condo.payments.enterSource' })
    const StatusTitle = intl.formatMessage({ id: 'Status' })
    const PaymentOrderTitle = intl.formatMessage({ id: 'PaymentOrder' })
    const PaymentOrderPlaceholder = intl.formatMessage({ id: 'accrualsAndPayments.payments.type.registry.filters.paymentOrder.placeholder' })
    const EnterStatusMessage = intl.formatMessage({ id: 'pages.condo.payments.enterStatus' })

    const statusOptions = useMemo(() => convertToOptions(statusType.map((item) => ({
        name: intl.formatMessage({ id: 'payment.status.' + item as FormatjsIntl.Message['ids'] }),
        id: item,
    })), 'name', 'id'), [intl])
    const sourceOptions = useMemo(() => convertToOptions(acquiringContexts.reduce<Array<{ id: string, name: string }>>((result, context) => {
        if (context.integration?.name) {
            result.push({ id: context.id, name: context.integration.name })
        }

        return result
    }, []), 'name', 'id'), [acquiringContexts])

    return useMemo(() => [
        {
            keyword: 'search',
            filters: [addressFilter, propertyFilter, accountFilter, orderFilter],
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
            keyword: 'order',
            filters: [orderFilter],
            component: {
                type: ComponentType.Input,
                props: {
                    placeholder: PaymentOrderPlaceholder,
                },
                modalFilterComponentWrapper: {
                    label: PaymentOrderTitle,
                    size: FilterComponentSize.Medium,
                },
            },
        },
        {
            keyword: 'type',
            filters: [acquiringContextFilter],
            component: {
                type: ComponentType.Select,
                options: sourceOptions,
                props: {
                    mode: 'multiple',
                    showArrow: true,
                    placeholder: EnterSourceMessage,
                },
                modalFilterComponentWrapper: {
                    label: SourceMessage,
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
                type: ComponentType.Input,
                modalFilterComponentWrapper: {
                    label: AddressMessage,
                    size: FilterComponentSize.Large,
                },
            },
        },
    ], [
        AccountTitle,
        AddressMessage,
        DepositedDateMessage,
        EndDateMessage,
        EnterSourceMessage,
        EnterStatusMessage,
        PaymentOrderPlaceholder,
        PaymentOrderTitle,
        SourceMessage,
        StartDateMessage,
        StatusTitle,
        TransferDateMessage,
        sourceOptions,
        statusOptions,
    ])
}
