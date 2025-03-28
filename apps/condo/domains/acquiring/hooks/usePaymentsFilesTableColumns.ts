import get from 'lodash/get'
import { useRouter } from 'next/router'
import { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { getPaymentsFileStatusRender } from '@condo/domains/acquiring/utils/clientSchema/Renders'
import {
    getColumnTooltip,
    getDateRender,
    getMoneyRender,
    getTextRender,
} from '@condo/domains/common/components/Table/Renders'
import { parseQuery } from '@condo/domains/common/utils/tables.utils'

export function usePaymentsFilesTableColumns (currencyCode: string): Record<string, unknown>[] {
    const intl = useIntl()
    const router = useRouter()

    const RegistryNumberTitle = intl.formatMessage({ id: 'accrualsAndPayments.payments.type.registry.registryNumber' })
    const AmountTitle = intl.formatMessage({ id: 'accrualsAndPayments.payments.type.registry.amount' })
    const DateLoadTitle = intl.formatMessage({ id: 'CreatedDate' })
    const RegistryNameTitle = intl.formatMessage({ id: 'accrualsAndPayments.payments.type.registry.registryName' })
    const UploadedRecordsTitle = intl.formatMessage({ id: 'accrualsAndPayments.payments.type.registry.uploadedRecords' })
    const PaymentOrderColumnTitle = intl.formatMessage({ id: 'accrualsAndPayments.payments.type.registry.paymentOrder' })

    const PaymentOrderTooltipTitle = intl.formatMessage({ id: 'PaymentOrder' })
    const StatusTitle = intl.formatMessage({ id: 'Status' })

    const { filters } = parseQuery(router.query)

    return useMemo(() => {
        let search = get(filters, 'search')
        search = Array.isArray(search) ? null : search

        const stringSearch = getTextRender(String(search))

        const columns = {
            number: {
                title: RegistryNumberTitle,
                key: 'number',
                dataIndex: 'number',
                width: '10%',
                render: stringSearch,
            },
            paymentOrder: {
                title: getColumnTooltip(PaymentOrderColumnTitle, PaymentOrderTooltipTitle),
                key: 'paymentOrder',
                dataIndex: 'paymentOrder',
                width: '10%',
                render: stringSearch,
            },
            loadedAt: {
                title: DateLoadTitle,
                key: 'loadedAt',
                dataIndex: ['loadedAt'],
                sorter: true,
                width: '15%',
                render: getDateRender(intl, String(search)),
            },
            registryName: {
                title: RegistryNameTitle,
                key: 'name',
                dataIndex: 'name',
                width: '30%',
                render: stringSearch,
            },
            amount: {
                title: AmountTitle,
                key: 'amount',
                dataIndex: 'amount',
                render: getMoneyRender(intl, currencyCode),
                width: '15%',
                sorter: true,
            },
            uploadedRecords: {
                title: UploadedRecordsTitle,
                key: 'paymentsCount',
                dataIndex: 'paymentsCount',
                width: '15%',
                render: stringSearch,
            },

            status: {
                title: StatusTitle,
                key: 'status',
                dataIndex: 'status',
                width: '15%',
                render: getPaymentsFileStatusRender(intl, search),
            },
        }

        return Object.values(columns)
    }, [filters, RegistryNumberTitle, PaymentOrderColumnTitle, PaymentOrderTooltipTitle, DateLoadTitle, intl, RegistryNameTitle, AmountTitle, currencyCode, UploadedRecordsTitle, StatusTitle])
}
