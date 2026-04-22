import { useGetOrganizationPaymentHistoryQuery, GetOrganizationPaymentHistoryQuery } from '@app/condo/gql'
import { ColumnsType } from 'antd/es/table/interface'
import getConfig from 'next/config'
import { useRouter } from 'next/router'
import { useMemo, useCallback, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Modal, Typography } from '@open-condo/ui'

import { Table } from '@condo/domains/common/components/Table/Index'
import {
    getDateRender,
} from '@condo/domains/common/components/Table/Renders'
import { getPageIndexFromOffset, parseQuery } from '@condo/domains/common/utils/tables.utils'

const { publicRuntimeConfig } = getConfig()
const CONDO_RB_DOMAIN = publicRuntimeConfig?.condoRBDomain || ''

const PAGE_SIZE = 12

type PaymentHistoryRecord = GetOrganizationPaymentHistoryQuery['paymentHistory'][number]

export const usePaymentHistoryModal = () => {
    const intl = useIntl()
    const router = useRouter()
    const { organization } = useOrganization()
    const [isModalOpen, setIsModalOpen] = useState(false)

    const { offset } = useMemo(() => parseQuery(router.query), [router.query])
    const currentPageIndex = getPageIndexFromOffset(offset, PAGE_SIZE)

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
            return intl.formatMessage({ id: 'subscription.paymentHistory.servicePlanLabel' }, { name })
        }
        if (planType === 'feature' && hasApps) {
            return intl.formatMessage({ id: 'subscription.paymentHistory.miniappPlanLabel' }, { name })
        }
        return name || '—'
    }, [intl])

    const getCardTypeLabel = useCallback((paymentSystem: string) => {
        const upperCaseSystem = paymentSystem.toUpperCase()
        const translationKey = `subscription.linkedCards.cardType.${upperCaseSystem}` as const
        return intl.formatMessage({ id: translationKey as any, defaultMessage: upperCaseSystem })
    }, [intl])

    const { data, loading } = useGetOrganizationPaymentHistoryQuery({
        variables: {
            organizationId: organization?.id || '',
            offset: (currentPageIndex - 1) * PAGE_SIZE,
            first: PAGE_SIZE,
        },
        skip: !organization?.id,
    })

    const paymentHistory = useMemo(() => data?.paymentHistory?.filter(Boolean) ?? [], [data?.paymentHistory])
    const totalCount = data?.meta?.count ?? 0
    const hasPaymentHistory = totalCount > 0

    const openModal = useCallback(() => {
        setIsModalOpen(true)
    }, [])

    const closeModal = useCallback(() => {
        setIsModalOpen(false)
    }, [])

    const columns: ColumnsType<PaymentHistoryRecord> = useMemo(() => [
        {
            title: DateColumnTitle,
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: '20%',
            render: getDateRender(intl, null, ''),
        },
        {
            title: PlanColumnTitle,
            dataIndex: 'subscriptionPlan',
            key: 'plan',
            width: '25%',
            render: (_, record) => getPlanLabel(record.subscriptionPlan),
        },
        {
            title: CardColumnTitle,
            dataIndex: 'frozenPaymentInfo',
            key: 'card',
            width: '20%',
            render: (_, record) => {
                const paymentMethod = record.frozenPaymentInfo?.paymentMethod
                if (!paymentMethod) return '—'
                const cardType = paymentMethod.paymentSystem ? getCardTypeLabel(paymentMethod.paymentSystem) : ''
                const lastFour = paymentMethod.cardNumber?.slice(-4) || ''
                return cardType && lastFour ? `${cardType} ∙ ${lastFour}` : '—'
            },
        },
        {
            title: AmountColumnTitle,
            dataIndex: 'frozenPaymentInfo.invoice',
            key: 'amount',
            width: '15%',
            render: (_, record) => {
                const invoice = record.frozenPaymentInfo?.invoice
                if (!invoice?.toPay) return '—'
                const currencySymbol = invoice.currencyCode || '₽'
                const amount = Number(invoice.toPay)
                return `${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currencySymbol}`
            },
        },
        {
            title: ReceiptColumnTitle,
            dataIndex: 'frozenPaymentInfo.multiPaymentId',
            key: 'receipt',
            width: '20%',
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
            <Table
                loading={loading}
                dataSource={paymentHistory}
                columns={columns}
                totalRows={totalCount}
                pageSize={PAGE_SIZE}
                rowKey={getRowId}
            />  
        </Modal>
    ), [isModalOpen, closeModal, PaymentHistoryTitle, loading, paymentHistory, columns, totalCount, getRowId])

    return {
        PaymentHistoryModal,
        openModal,
        hasPaymentHistory,
    }
}
