import { GetPaymentsFilesQuery } from '@app/condo/gql'
import { AcquiringIntegrationContext } from '@app/condo/schema'
import { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { TableColumn } from '@open-condo/ui'

import { getPaymentsFileStatusRender } from '@condo/domains/acquiring/utils/clientSchema/Renders'
import {
    getColumnTooltip,
    getDateRender,
    getMoneyRender,
    getTextRender,
} from '@condo/domains/common/components/Table/Renders'


type PaymentsFilesTableColumnsOptions = {
    acquiringContexts?: AcquiringIntegrationContext[]
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

    const RegistryNumberTitle = intl.formatMessage({ id: 'accrualsAndPayments.payments.type.registry.registryNumber' })
    const AmountTitle = intl.formatMessage({ id: 'accrualsAndPayments.payments.type.registry.amount' })
    const DateLoadTitle = intl.formatMessage({ id: 'accrualsAndPayments.payments.type.registry.filters.formationDate' })
    const RegistryNameTitle = intl.formatMessage({ id: 'accrualsAndPayments.payments.type.registry.registryName' })
    const UploadedRecordsTitle = intl.formatMessage({ id: 'accrualsAndPayments.payments.type.registry.uploadedRecords' })
    const PaymentOrderColumnTitle = intl.formatMessage({ id: 'accrualsAndPayments.payments.type.registry.paymentOrder' })

    const PaymentOrderTooltipTitle = intl.formatMessage({ id: 'PaymentOrder' })
    const PaymentSourceTitle = intl.formatMessage({ id: 'field.Source' })
    const StatusTitle = intl.formatMessage({ id: 'Status' })

    return useMemo(() => {
        const stringRender = getTextRender(options.search)
        const hasSourceColumn = Boolean(options.acquiringContexts?.length > 1)

        const columns: Record<string, PaymentsFileColumn | null> = {
            number: {
                header: RegistryNumberTitle,
                id: 'number',
                dataKey: paymentsFileDataKey('number'),
                enableSorting: false,
                initialSize: '10%',
                render: stringRender,
            },
            paymentOrder: {
                header: () => getColumnTooltip(PaymentOrderColumnTitle, PaymentOrderTooltipTitle),
                id: 'paymentOrder',
                dataKey: paymentsFileDataKey('paymentOrder'),
                enableSorting: false,
                initialSize: '15%',
                render: stringRender,
            },
            loadedAt: {
                header: DateLoadTitle,
                id: 'loadedAt',
                dataKey: paymentsFileDataKey('loadedAt'),
                enableSorting: true,
                initialSize: '15%',
                render: getDateRender(intl, options.search),
            },
            registryName: {
                header: RegistryNameTitle,
                id: 'name',
                dataKey: paymentsFileDataKey('name'),
                enableSorting: false,
                initialSize: hasSourceColumn ? '18%' : '25%',
                render: stringRender,
            },
            source: hasSourceColumn ? {
                header: PaymentSourceTitle,
                id: 'integration',
                dataKey: paymentsFileDataKey('context.integration.name'),
                enableSorting: false,
                initialSize: '7%',
            } : null,
            amount: {
                header: AmountTitle,
                id: 'amount',
                dataKey: paymentsFileDataKey('amount'),
                enableSorting: true,
                initialSize: '15%',
                render: getMoneyRender(intl, currencyCode),
            },
            uploadedRecords: {
                header: UploadedRecordsTitle,
                id: 'paymentsCount',
                dataKey: paymentsFileDataKey('paymentsCount'),
                enableSorting: false,
                initialSize: '10%',
                render: stringRender,
            },
            status: {
                header: StatusTitle,
                id: 'status',
                dataKey: paymentsFileDataKey('status'),
                enableSorting: false,
                initialSize: '12%',
                render: getPaymentsFileStatusRender(intl, options.search),
            },
        }

        return Object.values(columns).filter((column): column is PaymentsFileColumn => Boolean(column))
    }, [
        AmountTitle,
        DateLoadTitle,
        PaymentOrderColumnTitle,
        PaymentOrderTooltipTitle,
        PaymentSourceTitle,
        RegistryNameTitle,
        RegistryNumberTitle,
        StatusTitle,
        UploadedRecordsTitle,
        currencyCode,
        intl,
        options.acquiringContexts,
        options.search,
    ])
}
