import {
    useGetOrganizationActivatedSubscriptionsQuery,
    useGetOrganizationPaymentHistoryQuery,
    useGetOrganizationUnpaidSubscriptionsQuery,
    GetOrganizationPaymentHistoryQuery,
} from '@app/condo/gql'
import { ColumnsType } from 'antd/es/table/interface'
import dayjs from 'dayjs'
import getConfig from 'next/config'
import { useRouter } from 'next/router'
import React, { useMemo, useCallback, useState } from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { Mail, QuestionCircle, Send } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Button, Dropdown, Modal, Space, Tag, Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

import { Table } from '@condo/domains/common/components/Table/Index'
import { UI_HIDE_PAID_FEATURES } from '@condo/domains/common/constants/featureflags'
import { getPageIndexFromOffset, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { SubscriptionRemoveModal } from '@condo/domains/subscription/components/SubscriptionSettingsContent/SubscriptionRemoveModal/SubscriptionRemoveModal'
import { SUBSCRIPTION_PAYMENT_TYPE_INVOICE, SUBSCRIPTION_PLAN_TYPE_FEATURE } from '@condo/domains/subscription/constants'
import { getOutstandingPayments } from '@condo/domains/subscription/utils/subscriptionPlanAlerts'

import { useCancelSubscriptionFeatures } from './useCancelSubscriptionFeatures'
import { useOrganizationSubscription } from './useOrganizationSubscription'

import type { PlanAlertType } from '@condo/domains/subscription/utils/subscriptionPlanAlerts'

const { publicRuntimeConfig } = getConfig()
const CONDO_RB_DOMAIN = publicRuntimeConfig?.condoRBDomain || ''
const HELP_REQUISITES = publicRuntimeConfig?.HelpRequisites

const PAGE_SIZE = 12

const HELP_OPTION_WRAPPER_STYLE: React.CSSProperties = {
    width: '100%', padding: '10px 16px', display: 'flex', gap: '18px',
    backgroundColor: colors.gray[1], borderRadius: '8px', alignItems: 'center', justifyContent: 'space-between',
}

type PaymentHistoryRecord = GetOrganizationPaymentHistoryQuery['paymentHistory'][number]
type PlanLabelSource = Pick<PaymentHistoryRecord['subscriptionPlan'], 'name' | 'planType'> & Partial<Pick<PaymentHistoryRecord['subscriptionPlan'], 'enabledB2BApps' | 'enabledB2CApps'>>

type PaymentRow = {
    id: string
    createdAt: string
    planLabel: string
    isInvoice: boolean
    card: { paymentSystem?: string | null, cardNumber?: string | null } | null
    amount: { value: string, currencyCode: string } | null
    /** Null for a paid row, otherwise what is wrong with the payment */
    unpaid: { type: PlanAlertType, daysLeft: number } | null
    multiPaymentId: string | null
    /** Several contexts can share one invoice (a plan bought together with features); those collapse into a single row */
    invoiceId: string | null
}

type RemovableFeature = {
    planId: string
    name: string
}

/** One invoice is one document to the client, so contexts sharing an invoice show as a single row */
const mergeRowsByInvoice = (rows: ReadonlyArray<PaymentRow>): PaymentRow[] => {
    const merged: PaymentRow[] = []
    const mergedInvoiceIds = new Set<string>()

    for (const row of rows) {
        if (row.invoiceId && mergedInvoiceIds.has(row.invoiceId)) continue
        if (!row.invoiceId) {
            merged.push(row)
            continue
        }
        mergedInvoiceIds.add(row.invoiceId)

        const group = rows.filter(other => other.invoiceId === row.invoiceId)
        const amount = group.every(item => item.amount)
            ? { value: String(group.reduce((sum, item) => sum + Number(item.amount?.value), 0)), currencyCode: group[0].amount.currencyCode }
            : group[0].amount

        merged.push({ ...row, planLabel: group.map(item => item.planLabel).join(', '), amount })
    }

    return merged
}

export const usePaymentHistoryModal = () => {
    const intl = useIntl()
    const { useFlag } = useFeatureFlags()
    const hidePaidFeatures = useFlag(UI_HIDE_PAID_FEATURES)
    const router = useRouter()
    const { organization, role } = useOrganization()
    const { subscriptionContext: activeServiceContext } = useOrganizationSubscription()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [featuresToRemove, setFeaturesToRemove] = useState<ReadonlyArray<RemovableFeature>>([])
    const [isHelpModalOpen, setIsHelpModalOpen] = useState(false)

    const organizationId = organization?.id || ''
    const { offset } = useMemo(() => parseQuery(router.query), [router.query])
    const currentPageIndex = getPageIndexFromOffset(offset, PAGE_SIZE)

    const PaymentHistoryTitle = intl.formatMessage({ id: 'subscription.paymentHistory.title' })
    const DateColumnTitle = intl.formatMessage({ id: 'subscription.paymentHistory.column.date' })
    const PlanColumnTitle = intl.formatMessage({ id: 'subscription.paymentHistory.column.plan' })
    const PaymentMethodColumnTitle = intl.formatMessage({ id: 'subscription.paymentHistory.column.paymentMethod' })
    const AmountColumnTitle = intl.formatMessage({ id: 'subscription.paymentHistory.column.amount' })
    const StatusColumnTitle = intl.formatMessage({ id: 'subscription.paymentHistory.column.status' })
    const DocumentsColumnTitle = intl.formatMessage({ id: 'subscription.paymentHistory.column.documents' })
    const DownloadReceiptLabel = intl.formatMessage({ id: 'subscription.paymentHistory.downloadReceipt' })
    const InvoiceLabel = intl.formatMessage({ id: 'subscription.paymentHistory.paymentMethod.invoice' })
    const NeedHelpLabel = intl.formatMessage({ id: 'subscription.paymentHistory.needHelp' })
    const HelpModalTitle = intl.formatMessage({ id: 'subscription.paymentHistory.helpModal.title' })
    const HelpModalDescription = intl.formatMessage({ id: 'subscription.paymentHistory.helpModal.description' })
    const HelpModalEmailLabel = intl.formatMessage({ id: 'subscription.paymentHistory.helpModal.email' })
    const HelpModalBotLabel = intl.formatMessage({ id: 'subscription.paymentHistory.helpModal.bot' })
    const RemoveManyLabel = intl.formatMessage({ id: 'subscription.paymentHistory.remove.many' })
    const RemoveAllLabel = intl.formatMessage({ id: 'subscription.paymentHistory.remove.all' })

    const getPlanLabel = useCallback((plan: PlanLabelSource | null): string => {
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

    const { data: unpaidData } = useGetOrganizationUnpaidSubscriptionsQuery({
        variables: { organizationId },
        skip: !organizationId || hidePaidFeatures,
    })
    const { data: activatedData } = useGetOrganizationActivatedSubscriptionsQuery({
        variables: { organizationId },
        skip: !organizationId || hidePaidFeatures,
    })

    const outstandingPayments = useMemo(() => getOutstandingPayments(
        unpaidData?.unpaidSubscriptions ?? [],
        activatedData?.activatedSubscriptions ?? [],
        new Date(),
    ), [unpaidData, activatedData])

    const unpaidRows = useMemo<PaymentRow[]>(() => outstandingPayments.map(({ context, type, daysLeft }) => ({
        id: context.id,
        createdAt: context.createdAt,
        planLabel: getPlanLabel(context.subscriptionPlan),
        isInvoice: context.frozenPaymentInfo?.paymentType === SUBSCRIPTION_PAYMENT_TYPE_INVOICE,
        card: context.frozenPaymentInfo?.paymentMethod ?? null,
        amount: context.subscriptionPlanPricingRule?.price && context.subscriptionPlanPricingRule?.currencyCode
            ? { value: context.subscriptionPlanPricingRule.price, currencyCode: context.subscriptionPlanPricingRule.currencyCode }
            : null,
        unpaid: { type, daysLeft },
        multiPaymentId: null,
        invoiceId: context.invoice?.id ?? null,
    })), [outstandingPayments, getPlanLabel])

    // Unpaid rows are prepended on page 1 only, so paid rows there fill whatever room is left,
    // and every later page's paid offset shifts back by however many unpaid rows took that room
    const isFirstPage = currentPageIndex === 1
    const paidRowsFirst = isFirstPage ? Math.max(0, PAGE_SIZE - unpaidRows.length) : PAGE_SIZE
    const paidRowsOffset = Math.max(0, (currentPageIndex - 1) * PAGE_SIZE - unpaidRows.length)

    const { data, loading } = useGetOrganizationPaymentHistoryQuery({
        variables: {
            organizationId,
            offset: paidRowsOffset,
            first: paidRowsFirst,
        },
        skip: !organizationId,
    })

    const { cancelFeaturePlans, loading: cancelLoading } = useCancelSubscriptionFeatures()

    const paidRows = useMemo<PaymentRow[]>(() => (data?.paymentHistory ?? []).filter(Boolean).map(record => {
        const rule = record.subscriptionPlanPricingRule
        const invoice = record.frozenPaymentInfo?.invoice
        // one invoice may pay for a whole bundle, the pricing rule is what this very row cost
        const value = rule?.price ?? invoice?.toPay ?? null
        const currencyCode = rule?.currencyCode ?? invoice?.currencyCode ?? null

        return {
            id: record.id,
            createdAt: record.createdAt,
            planLabel: getPlanLabel(record.subscriptionPlan),
            isInvoice: record.frozenPaymentInfo?.paymentType === SUBSCRIPTION_PAYMENT_TYPE_INVOICE || !record.frozenPaymentInfo?.paymentMethod,
            card: record.frozenPaymentInfo?.paymentMethod ?? null,
            amount: value && currencyCode ? { value, currencyCode } : null,
            unpaid: null,
            multiPaymentId: record.frozenPaymentInfo?.multiPaymentId ?? null,
            invoiceId: record.frozenPaymentInfo?.invoice?.id ?? null,
        }
    }), [data, getPlanLabel])

    // What still waits for a payment is what the client came here for, so it leads the first page
    const rows = useMemo(
        () => mergeRowsByInvoice(currentPageIndex === 1 ? [...unpaidRows, ...paidRows] : paidRows),
        [currentPageIndex, unpaidRows, paidRows]
    )

    // A bundle that also bought the plan itself is not offered here - only a features-only invoice can be dropped
    const planBundleInvoiceIds = useMemo(() => new Set(
        outstandingPayments
            .filter(({ context }) => context.subscriptionPlan?.planType !== SUBSCRIPTION_PLAN_TYPE_FEATURE && context.invoice?.id)
            .map(({ context }) => context.invoice.id)
    ), [outstandingPayments])

    // Only a dead invoice/charge can be dropped by hand - one still within its payment window is still owed
    const removableFeatures = useMemo<ReadonlyArray<RemovableFeature & { invoiceId: string | null }>>(() => outstandingPayments
        .filter(({ context, type }) => context.subscriptionPlan?.planType === SUBSCRIPTION_PLAN_TYPE_FEATURE
            && (type === 'invoiceExpired' || type === 'cardFailed')
            && !(context.invoice?.id && planBundleInvoiceIds.has(context.invoice.id)))
        .map(({ context }) => ({ planId: context.subscriptionPlan.id, name: context.subscriptionPlan.name || '', invoiceId: context.invoice?.id ?? null })),
    [outstandingPayments, planBundleInvoiceIds])

    // One invoice is removed as a whole, never one feature at a time out of it
    const removableGroups = useMemo(() => {
        const groups: { key: string, name: string, features: RemovableFeature[] }[] = []
        const seenInvoiceIds = new Set<string>()

        for (const feature of removableFeatures) {
            if (feature.invoiceId && seenInvoiceIds.has(feature.invoiceId)) continue

            const groupFeatures = feature.invoiceId
                ? removableFeatures.filter(other => other.invoiceId === feature.invoiceId)
                : [feature]
            if (feature.invoiceId) seenInvoiceIds.add(feature.invoiceId)

            groups.push({
                key: feature.invoiceId ?? feature.planId,
                name: groupFeatures.map(item => item.name).join(', '),
                features: groupFeatures.map(({ planId, name }) => ({ planId, name })),
            })
        }

        return groups
    }, [removableFeatures])

    const paidTotalCount = data?.meta?.count ?? 0
    // The Table paginates the combined list, so it needs the combined total, not just the paid rows'
    const totalCount = paidTotalCount + unpaidRows.length
    const hasPaymentHistory = totalCount > 0

    const openModal = useCallback(() => {
        if (hidePaidFeatures) return
        setIsModalOpen(true)
    }, [hidePaidFeatures])

    const closeModal = useCallback(() => {
        setIsModalOpen(false)
    }, [])

    const handleRemoveConfirm = useCallback(async () => {
        await cancelFeaturePlans(featuresToRemove.map(feature => feature.planId))
        setFeaturesToRemove([])
    }, [cancelFeaturePlans, featuresToRemove])

    const renderStatus = useCallback((row: PaymentRow) => {
        if (!row.unpaid) {
            return <Tag bgColor={colors.green[5]} textColor={colors.white}>{intl.formatMessage({ id: 'subscription.paymentHistory.status.paid' })}</Tag>
        }

        switch (row.unpaid.type) {
            case 'invoicePending':
                return (
                    <Tag bgColor={colors.orange[5]} textColor={colors.white}>
                        {intl.formatMessage({ id: 'subscription.planCard.badge.invoicePending' }, { days: row.unpaid.daysLeft })}
                    </Tag>
                )
            case 'invoiceExpired':
                return <Tag bgColor={colors.red[5]} textColor={colors.white}>{intl.formatMessage({ id: 'subscription.planCard.badge.invoiceExpired' })}</Tag>
            default:
                return <Tag bgColor={colors.red[5]} textColor={colors.white}>{intl.formatMessage({ id: 'subscription.planCard.badge.cardFailed' })}</Tag>
        }
    }, [intl])

    const columns: ColumnsType<PaymentRow> = useMemo(() => [
        {
            title: DateColumnTitle,
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: '15%',
            render: (_, row) => {
                const date = dayjs(row.createdAt)
                return (
                    <Typography.Text>
                        {`${date.format('DD.MM.YYYY')}, `}
                        <Typography.Text type='secondary'>{date.format('HH:mm')}</Typography.Text>
                    </Typography.Text>
                )
            },
        },
        {
            title: PlanColumnTitle,
            dataIndex: 'planLabel',
            key: 'plan',
            width: '20%',
            render: (_, row) => row.planLabel,
        },
        {
            title: PaymentMethodColumnTitle,
            dataIndex: 'card',
            key: 'paymentMethod',
            width: '15%',
            render: (_, row) => {
                if (row.isInvoice) return InvoiceLabel
                const cardType = row.card?.paymentSystem ? getCardTypeLabel(row.card.paymentSystem) : ''
                const lastFour = row.card?.cardNumber?.slice(-4) || ''
                return cardType && lastFour ? `${cardType} ∙ ${lastFour}` : '—'
            },
        },
        {
            title: AmountColumnTitle,
            dataIndex: 'amount',
            key: 'amount',
            width: '15%',
            render: (_, row) => row.amount
                ? intl.formatNumber(Number(row.amount.value), { style: 'currency', currency: row.amount.currencyCode, minimumFractionDigits: 2 })
                : '—',
        },
        {
            title: StatusColumnTitle,
            dataIndex: 'unpaid',
            key: 'status',
            width: '20%',
            render: (_, row) => renderStatus(row),
        },
        {
            title: DocumentsColumnTitle,
            dataIndex: 'multiPaymentId',
            key: 'documents',
            width: '15%',
            render: (_, row) => {
                if (!row.multiPaymentId) return '—'
                // TODO(DOMA-13128): Add check page in condo
                const receiptUrl = `${CONDO_RB_DOMAIN}/check/${row.multiPaymentId}`
                return (
                    <Typography.Link id={`subscription-payment-history-${row.multiPaymentId}-receipt-link`} href={receiptUrl} target='_blank'>
                        {DownloadReceiptLabel}
                    </Typography.Link>
                )
            },
        },
    ], [DateColumnTitle, PlanColumnTitle, PaymentMethodColumnTitle, AmountColumnTitle, StatusColumnTitle, DocumentsColumnTitle, InvoiceLabel, DownloadReceiptLabel, intl, getCardTypeLabel, renderStatus])

    const getRowId = useCallback((row: PaymentRow) => row.id, [])

    const canManageSubscriptions = Boolean(role?.canManageSubscriptions)

    const PaymentHistoryModal = useMemo(() => {
        if (hidePaidFeatures) return null

        const supportBotName = HELP_REQUISITES?.support_bot ?? null
        const supportEmail = HELP_REQUISITES?.support_email ?? null
        const helpUrl = supportBotName ? `https://t.me/${supportBotName}` : null

        let removeButton: React.ReactNode = null
        if (canManageSubscriptions && removableGroups.length === 1) {
            const group = removableGroups[0]
            removeButton = (
                <Button
                    id='subscription-payment-history-remove-button'
                    type='secondary'
                    onClick={() => setFeaturesToRemove(group.features)}
                >
                    {intl.formatMessage({ id: 'subscription.paymentHistory.remove.one' }, { name: group.name })}
                </Button>
            )
        } else if (canManageSubscriptions && removableGroups.length > 1) {
            removeButton = (
                <Dropdown.Button
                    id='subscription-payment-history-remove-button'
                    type='secondary'
                    items={[
                        ...removableGroups.map(group => ({
                            key: group.key,
                            label: group.name,
                            onClick: () => setFeaturesToRemove(group.features),
                        })),
                        { key: 'all', label: RemoveAllLabel, onClick: () => setFeaturesToRemove(removableFeatures.map(({ planId, name }) => ({ planId, name }))) },
                    ]}
                >
                    {RemoveManyLabel}
                </Dropdown.Button>
            )
        }

        const footer = helpUrl || removeButton ? (
            <Space size={24} direction='horizontal' align='center'>
                {helpUrl && (
                    <Typography.Link id='subscription-payment-history-help-link' onClick={() => setIsHelpModalOpen(true)}>
                        <Space size={4} direction='horizontal' align='center'>
                            {NeedHelpLabel}
                            <QuestionCircle size='small' />
                        </Space>
                    </Typography.Link>
                )}
                {removeButton}
            </Space>
        ) : null

        const paidUntil = (activatedData?.activatedSubscriptions ?? [])
            .filter(context => !context.isTrial && featuresToRemove.some(feature => feature.planId === context.subscriptionPlan?.id))
            .map(context => context.endAt)
            .sort()
            .pop() ?? null

        return (
            <>
                <Modal
                    open={isModalOpen}
                    onCancel={closeModal}
                    title={PaymentHistoryTitle}
                    footer={footer}
                    width='big'
                >
                    <Table
                        loading={loading}
                        dataSource={rows}
                        columns={columns}
                        totalRows={totalCount}
                        pageSize={PAGE_SIZE}
                        rowKey={getRowId}
                    />
                </Modal>
                <SubscriptionRemoveModal
                    open={featuresToRemove.length > 0}
                    onCancel={() => setFeaturesToRemove([])}
                    names={featuresToRemove.map(feature => feature.name)}
                    planName={activeServiceContext?.subscriptionPlan?.name ?? ''}
                    paidUntil={paidUntil}
                    loading={cancelLoading}
                    onConfirm={handleRemoveConfirm}
                />
                {helpUrl && (
                    <Modal
                        open={isHelpModalOpen}
                        onCancel={() => setIsHelpModalOpen(false)}
                        title={(
                            <Space size={8} direction='vertical'>
                                <Typography.Title level={3}>{HelpModalTitle}</Typography.Title>
                                <Typography.Text size='medium' type='secondary'>{HelpModalDescription}</Typography.Text>
                            </Space>
                        )}
                    >
                        <Space size={8} direction='vertical' width='100%'>
                            {supportEmail && (
                                <a href={`mailto:${supportEmail}`} target='_blank' style={HELP_OPTION_WRAPPER_STYLE} rel='noreferrer'>
                                    <Space size={16}>
                                        <Mail size='medium' color={colors.gray[7]} />
                                        <Typography.Text>{HelpModalEmailLabel} {supportEmail}</Typography.Text>
                                    </Space>
                                </a>
                            )}
                            <a href={helpUrl} target='_blank' style={HELP_OPTION_WRAPPER_STYLE} rel='noreferrer'>
                                <Space size={16}>
                                    <Send size='medium' color={colors.gray[7]} />
                                    <Typography.Text>{HelpModalBotLabel} @{supportBotName}</Typography.Text>
                                </Space>
                            </a>
                        </Space>
                    </Modal>
                )}
            </>
        )
    }, [hidePaidFeatures, canManageSubscriptions, removableGroups, removableFeatures, intl, RemoveAllLabel, RemoveManyLabel, NeedHelpLabel, activatedData, featuresToRemove, isModalOpen, closeModal, PaymentHistoryTitle, loading, rows, columns, totalCount, getRowId, activeServiceContext, cancelLoading, handleRemoveConfirm, isHelpModalOpen, HelpModalTitle, HelpModalDescription, HelpModalEmailLabel, HelpModalBotLabel])

    return {
        PaymentHistoryModal,
        openModal,
        hasPaymentHistory: !hidePaidFeatures && hasPaymentHistory,
    }
}
