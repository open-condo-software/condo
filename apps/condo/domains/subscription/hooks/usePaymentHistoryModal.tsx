import { useGetOrganizationPaymentHistoryLazyQuery, GetOrganizationPaymentHistoryQuery } from '@app/condo/gql'
import dayjs from 'dayjs'
import getConfig from 'next/config'
import { useMemo, useCallback, useEffect, useState } from 'react'


import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Modal, Table, TableColumn, GetTableData, Typography } from '@open-condo/ui'

import {
    getDateRender,
} from '@condo/domains/common/components/Table/Renders'

const { publicRuntimeConfig } = getConfig()
const CONDO_RB_DOMAIN = publicRuntimeConfig?.condoRBDomain || ''

const PAGE_SIZE = 12

type PaymentHistoryRecord = GetOrganizationPaymentHistoryQuery['paymentHistory'][number]

export const usePaymentHistoryModal = () => {
    const intl = useIntl()
    const { organization } = useOrganization()
    const [isModalOpen, setIsModalOpen] = useState(false)

    const PaymentHistoryTitle = intl.formatMessage({ id: 'subscription.paymentHistory.title' })
    const DateColumnTitle = intl.formatMessage({ id: 'subscription.paymentHistory.column.date' })
    const PlanColumnTitle = intl.formatMessage({ id: 'subscription.paymentHistory.column.plan' })
    const CardColumnTitle = intl.formatMessage({ id: 'subscription.paymentHistory.column.card' })
    const AmountColumnTitle = intl.formatMessage({ id: 'subscription.paymentHistory.column.amount' })
    const ReceiptColumnTitle = intl.formatMessage({ id: 'subscription.paymentHistory.column.receipt' })
    const DownloadReceiptLabel = intl.formatMessage({ id: 'subscription.paymentHistory.downloadReceipt' })

    const getPlanLabel = useCallback((plan: PaymentHistoryRecord['subscriptionPlan']): string => {
        if (!plan) return '—'
        const name = plan.name || ''
        const planType = plan.planType
        const hasApps = (plan.enabledB2BApps?.length ?? 0) > 0 || (plan.enabledB2CApps?.length ?? 0) > 0

        if (planType === 'service') {
            return intl.formatMessage({ id: 'subscription.paymentHistory.servicePlanLabel' as FormatjsIntl.Message['ids'] }, { name })
        }
        if (planType === 'feature' && hasApps) {
            return intl.formatMessage({ id: 'subscription.paymentHistory.miniappPlanLabel' as FormatjsIntl.Message['ids'] }, { name })
        }
        return name || '—'
    }, [intl])

    const getCardTypeLabel = useCallback((paymentSystem: string) => {
        const upperCaseSystem = paymentSystem.toUpperCase()
        const translationKey = `subscription.linkedCards.cardType.${upperCaseSystem}` as const
        return intl.formatMessage({ id: translationKey as any, defaultMessage: upperCaseSystem })
    }, [intl])

    const [fetchPaymentHistory, { data: lazyData }] = useGetOrganizationPaymentHistoryLazyQuery()
    const hasPaymentHistory = (lazyData?.meta?.count ?? 0) > 0

    useEffect(() => {
        if (organization?.id) {
            fetchPaymentHistory({ variables: { organizationId: organization.id, offset: 0, first: 1 } })
        }
    }, [organization?.id, fetchPaymentHistory])

    const openModal = useCallback(() => {
        setIsModalOpen(true)
    }, [])

    const closeModal = useCallback(() => {
        setIsModalOpen(false)
    }, [])

    const dataSource: GetTableData<PaymentHistoryRecord> = useCallback(async ({ startRow, endRow }) => {
        if (!organization?.id) {
            return { rowData: [], rowCount: 0 }
        }

        const skip = startRow
        const first = endRow - startRow

        const { data } = await fetchPaymentHistory({
            variables: {
                organizationId: organization.id,
                offset: skip,
                first,
            },
            fetchPolicy: 'network-only',
        })

        return {
            rowData: data?.paymentHistory?.filter(Boolean) ?? [],
            rowCount: data?.meta?.count ?? 0,
        }
    }, [organization?.id, fetchPaymentHistory])

    const columns: TableColumn<PaymentHistoryRecord>[] = useMemo(() => [
        {
            header: DateColumnTitle,
            dataKey: 'createdAt',
            id: 'createdAt',
            initialSize: '20%',
            render: getDateRender(intl, null, ''),
        },
        {
            header: PlanColumnTitle,
            dataKey: 'subscriptionPlan',
            id: 'plan',
            initialSize: '25%',
            enableSorting: false,
            render: (_, record) => getPlanLabel(record.subscriptionPlan),
        },
        {
            header: CardColumnTitle,
            dataKey: 'frozenPaymentInfo',
            id: 'card',
            initialSize: '20%',
            enableSorting: false,
            render: (_, record) => {
                const paymentMethod = record.frozenPaymentInfo?.paymentMethod
                if (!paymentMethod) return '—'
                const cardType = paymentMethod.paymentSystem ? getCardTypeLabel(paymentMethod.paymentSystem) : ''
                const lastFour = paymentMethod.cardNumber?.slice(-4) || ''
                return cardType && lastFour ? `${cardType} ∙ ${lastFour}` : '—'
            },
        },
        {
            header: AmountColumnTitle,
            dataKey: 'frozenPaymentInfo.invoice',
            id: 'amount',
            initialSize: '15%',
            enableSorting: false,
            render: (_, record) => {
                const invoice = record.frozenPaymentInfo?.invoice
                if (!invoice?.toPay) return '—'
                const currencySymbol = invoice.currencyCode || '₽'
                const amount = Number(invoice.toPay)
                return `${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currencySymbol}`
            },
        },
        {
            header: ReceiptColumnTitle,
            dataKey: 'frozenPaymentInfo.multiPaymentId',
            id: 'receipt',
            initialSize: '20%',
            enableSorting: false,
            render: (_, record) => {
                const multiPaymentId = record.frozenPaymentInfo?.multiPaymentId
                if (!multiPaymentId) return '—'
                // TODO(DOMA-13128): Add check page in condo
                const receiptUrl = `${CONDO_RB_DOMAIN}/check/${multiPaymentId}`
                return (
                    <Typography.Link href={receiptUrl} target='_blank'>
                        {DownloadReceiptLabel}
                    </Typography.Link>
                )
            },
        },
    ], [DateColumnTitle, intl, PlanColumnTitle, CardColumnTitle, AmountColumnTitle, ReceiptColumnTitle, getPlanLabel, getCardTypeLabel, DownloadReceiptLabel])

    const getRowId = useCallback((row: PaymentHistoryRecord) => row.id, [])

    const PaymentHistoryModal = useMemo(() => (
        <Modal
            open={isModalOpen}
            onCancel={closeModal}
            title={PaymentHistoryTitle}
            footer={null}
            width='big'
        >
            <Table<PaymentHistoryRecord>
                id='payment-history-table'
                dataSource={dataSource}
                columns={columns}
                pageSize={PAGE_SIZE}
                getRowId={getRowId}
            />
        </Modal>
    ), [isModalOpen, closeModal, PaymentHistoryTitle, dataSource, columns, getRowId])

    return {
        PaymentHistoryModal,
        openModal,
        hasPaymentHistory,
    }
}
