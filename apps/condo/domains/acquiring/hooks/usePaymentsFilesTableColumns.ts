import { GetPaymentsFilesQuery } from '@app/condo/gql'
import { AcquiringIntegrationContext, PaymentsFileWhereInput } from '@app/condo/schema'
import dayjs from 'dayjs'
import { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { TableColumn } from '@open-condo/ui'

import { getPaymentsFileStatusRender } from '@condo/domains/acquiring/utils/clientSchema/Renders'
import {
    getColumnTooltip,
    getDateRender,
    getMoneyRender,
    getTableCellRenderer,
    getTextRender,
} from '@condo/domains/common/components/Table/Renders'
import { FiltersMeta, getFilterComponentByKey, TableFiltersMeta } from '@condo/domains/common/utils/filters.utils'


type PaymentsFilesTableColumnsOptions = {
    acquiringContexts?: AcquiringIntegrationContext[]
    filterMetas?: FiltersMeta<PaymentsFileWhereInput>[]
    search?: string
}

type PaymentsFile = NonNullable<NonNullable<GetPaymentsFilesQuery['paymentsFiles']>[number]>
type PaymentsFileColumn = TableColumn<PaymentsFile>
type PaymentsFileDataKey = Extract<PaymentsFileColumn, { dataKey: unknown }>['dataKey']

const paymentsFileDataKey = <TKey extends PaymentsFileDataKey>(value: TKey): TKey => value

export function usePaymentsFilesTableColumns (
    currencyCode: string,
    options: PaymentsFilesTableColumnsOptions = {}
): PaymentsFileColumn[] {
    const intl = useIntl()

    const RegistryNumberTitle = intl.formatMessage({ id: 'global.number' })
    const AmountTitle = intl.formatMessage({ id: 'accrualsAndPayments.payments.type.registry.amount' })
    const DateLoadTitle = intl.formatMessage({ id: 'TransferDate' })
    const DateLoadTooltipTitle = intl.formatMessage({ id: 'accrualsAndPayments.payments.type.registry.filters.formationDate' })
    const RegistryNameTitle = intl.formatMessage({ id: 'accrualsAndPayments.payments.type.registry.registryName' })
    const UploadedRecordsTitle = intl.formatMessage({ id: 'accrualsAndPayments.payments.type.registry.uploadedRecords' })
    const PaymentOrderColumnTitle = intl.formatMessage({ id: 'PaymentOrderShort' })

    const PaymentOrderTooltipTitle = intl.formatMessage({ id: 'PaymentOrder' })
    const PaymentDateTitle = intl.formatMessage({ id: 'DepositedDate' })
    const PaymentSourceTitle = intl.formatMessage({ id: 'field.Source' })
    const StatusTitle = intl.formatMessage({ id: 'Status' })

    return useMemo(() => {
        const stringRender = getTextRender(options.search)
        const fileNameRender = getTableCellRenderer({
            search: options.search,
            ellipsis: { rows: 1, expandable: false },
        })
        const hasSourceColumn = Boolean(options.acquiringContexts?.length > 1)

        const columns: Record<string, PaymentsFileColumn | null> = {
            number: {
                header: RegistryNumberTitle,
                id: 'number',
                dataKey: paymentsFileDataKey('number'),
                enableSorting: true,
                initialSize: '7%',
                render: stringRender,
            },
            paymentPeriod: {
                header: PaymentDateTitle,
                id: 'paymentPeriod',
                dataKey: paymentsFileDataKey('paymentPeriodStartDate'),
                enableSorting: true,
                filterComponent: getFilterComponentByKey(
                    (options.filterMetas || []) as TableFiltersMeta<PaymentsFileWhereInput>[],
                    'paymentPeriod'
                ),
                initialSize: '11%',
                render: (paymentPeriodStartDate: string) => {
                    if (!paymentPeriodStartDate) return stringRender('')

                    return stringRender(dayjs(paymentPeriodStartDate).format('DD.MM.YYYY'))
                },
            },
            loadedAt: {
                header: () => getColumnTooltip(DateLoadTitle, DateLoadTooltipTitle),
                id: 'loadedAt',
                dataKey: paymentsFileDataKey('loadedAt'),
                enableSorting: true,
                filterComponent: getFilterComponentByKey(
                    (options.filterMetas || []) as TableFiltersMeta<PaymentsFileWhereInput>[],
                    'loadedAt'
                ),
                initialVisibility: false,
                initialSize: '12%',
                render: getDateRender(intl, options.search),
            },
            paymentOrder: {
                header: () => getColumnTooltip(PaymentOrderColumnTitle, PaymentOrderTooltipTitle),
                id: 'paymentOrder',
                dataKey: paymentsFileDataKey('paymentOrder'),
                enableSorting: false,
                filterComponent: getFilterComponentByKey(
                    (options.filterMetas || []) as TableFiltersMeta<PaymentsFileWhereInput>[],
                    'paymentOrder'
                ),
                initialSize: '10%',
                render: stringRender,
            },
            registryName: {
                header: RegistryNameTitle,
                id: 'name',
                dataKey: paymentsFileDataKey('name'),
                enableSorting: false,
                render: fileNameRender,
            },
            amount: {
                header: AmountTitle,
                id: 'amount',
                dataKey: paymentsFileDataKey('amount'),
                enableSorting: true,
                initialSize: '13%',
                render: getMoneyRender(intl, currencyCode),
            },
            uploadedRecords: {
                header: UploadedRecordsTitle,
                id: 'paymentsCount',
                dataKey: paymentsFileDataKey('paymentsCount'),
                enableSorting: true,
                initialSize: '12%',
                render: stringRender,
            },
            source: hasSourceColumn ? {
                header: PaymentSourceTitle,
                id: 'type',
                dataKey: paymentsFileDataKey('context.integration.name'),
                enableSorting: false,
                filterComponent: getFilterComponentByKey(
                    (options.filterMetas || []) as TableFiltersMeta<PaymentsFileWhereInput>[],
                    'type'
                ),
                initialSize: '10%',
            } : null,
            status: {
                header: StatusTitle,
                id: 'status',
                dataKey: paymentsFileDataKey('status'),
                enableSorting: false,
                filterComponent: getFilterComponentByKey(
                    (options.filterMetas || []) as TableFiltersMeta<PaymentsFileWhereInput>[],
                    'status'
                ),
                initialSize: '11%',
                render: getPaymentsFileStatusRender(intl, options.search),
            },
        }

        return Object.values(columns).filter((column): column is PaymentsFileColumn => Boolean(column))
    }, [
        AmountTitle,
        DateLoadTitle,
        DateLoadTooltipTitle,
        PaymentOrderColumnTitle,
        PaymentOrderTooltipTitle,
        PaymentDateTitle,
        PaymentSourceTitle,
        RegistryNameTitle,
        RegistryNumberTitle,
        StatusTitle,
        UploadedRecordsTitle,
        currencyCode,
        intl,
        options.acquiringContexts,
        options.filterMetas,
        options.search,
    ])
}
