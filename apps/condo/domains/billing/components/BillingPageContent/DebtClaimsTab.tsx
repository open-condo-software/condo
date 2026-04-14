import { useQuery } from '@apollo/client'
import dayjs from 'dayjs'
import get from 'lodash/get'
import React, { useCallback, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Button, Space, Typography } from '@open-condo/ui'

import { Table } from '@condo/domains/common/components/Table/Index'
import { BasicEmptyListView } from '@condo/domains/common/components/EmptyListView'
import { GET_DEBT_CLAIM_GENERATION_TASKS_QUERY } from '@condo/domains/billing/gql'
import { DebtClaimGenerationModal } from './DebtClaimGenerationModal'

import type { TableColumnsType } from 'antd'


const EMPTY_IMG = '/dino/waiting@2x.png'

type DebtClaimTask = {
    id: string
    createdAt: string
    debtorsFile: { publicUrl: string; originalFilename: string } | null
    resultFile: { publicUrl: string; originalFilename: string } | null
    meta: {
        successCount?: number
        failedCount?: number
        totalAmount?: number
    } | null
}

export const DebtClaimsTab: React.FC = () => {
    const intl = useIntl()
    const TabEmptyTitle = intl.formatMessage({ id: 'billing.debtClaims.tab.empty.title' })
    const TabEmptyMessage = intl.formatMessage({ id: 'billing.debtClaims.tab.empty.message' })
    const GenerateButtonLabel = intl.formatMessage({ id: 'billing.debtClaims.tab.generateButton' })
    const ColDateTitle = intl.formatMessage({ id: 'billing.debtClaims.tab.table.col.date' })
    const ColDebtorsFileTitle = intl.formatMessage({ id: 'billing.debtClaims.tab.table.col.debtorsFile' })
    const ColDebtorsCountTitle = intl.formatMessage({ id: 'billing.debtClaims.tab.table.col.debtorsCount' })
    const ColTotalAmountTitle = intl.formatMessage({ id: 'billing.debtClaims.tab.table.col.totalAmount' })
    const ColResultFileTitle = intl.formatMessage({ id: 'billing.debtClaims.tab.table.col.resultFile' })
    const DownloadLabel = intl.formatMessage({ id: 'billing.debtClaims.tab.table.downloadLink' })
    const LoadingMessage = intl.formatMessage({ id: 'billing.debtClaims.tab.loading' })

    const userOrganization = useOrganization()
    const organizationId: string = get(userOrganization, 'organization.id', '')
    const userId: string = get(userOrganization, 'link.user.id', '')
    const canImport = get(userOrganization, ['link', 'role', 'canImportBillingReceipts'], false)
        || get(userOrganization, ['link', 'role', 'canManageIntegrations'], false)

    const [isModalOpen, setIsModalOpen] = useState(false)

    const { data, loading, refetch } = useQuery(GET_DEBT_CLAIM_GENERATION_TASKS_QUERY, {
        variables: {
            where: {
                organization: { id: organizationId },
                status: 'completed',
                deletedAt: null,
            },
            sortBy: ['createdAt_DESC'],
            first: 1,
        },
        skip: !organizationId,
        fetchPolicy: 'network-only',
    })

    const lastTask: DebtClaimTask | null = data?.tasks?.[0] || null

    const handleOpenModal = useCallback(() => setIsModalOpen(true), [])
    const handleCloseModal = useCallback(() => setIsModalOpen(false), [])
    const handleSuccess = useCallback(() => {
        refetch()
    }, [refetch])

    const columns: TableColumnsType<DebtClaimTask> = [
        {
            title: ColDateTitle,
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (val: string) => val ? dayjs(val).format('DD.MM.YYYY HH:mm') : '—',
        },
        {
            title: ColDebtorsFileTitle,
            dataIndex: 'debtorsFile',
            key: 'debtorsFile',
            render: (file: DebtClaimTask['debtorsFile']) =>
                file?.publicUrl
                    ? <Typography.Link href={file.publicUrl} target='_blank'>{file.originalFilename || DownloadLabel}</Typography.Link>
                    : '—',
        },
        {
            title: ColDebtorsCountTitle,
            dataIndex: 'meta',
            key: 'debtorsCount',
            render: (meta: DebtClaimTask['meta']) => {
                const success = meta?.successCount || 0
                const failed = meta?.failedCount || 0
                return success + failed || '—'
            },
        },
        {
            title: ColTotalAmountTitle,
            dataIndex: 'meta',
            key: 'totalAmount',
            render: (meta: DebtClaimTask['meta']) =>
                meta?.totalAmount != null
                    ? `${Number(meta.totalAmount).toLocaleString('ru-RU')} ₽`
                    : '—',
        },
        {
            title: ColResultFileTitle,
            dataIndex: 'resultFile',
            key: 'resultFile',
            render: (file: DebtClaimTask['resultFile']) =>
                file?.publicUrl
                    ? <Typography.Link href={file.publicUrl} download={file.originalFilename || true}>{DownloadLabel}</Typography.Link>
                    : '—',
        },
    ]

    if (loading) {
        return (
            <BasicEmptyListView image={EMPTY_IMG}>
                <Typography.Text type='secondary'>{LoadingMessage}</Typography.Text>
            </BasicEmptyListView>
        )
    }

    if (!lastTask) {
        return (
            <>
                <BasicEmptyListView image={EMPTY_IMG}>
                    <Space size={16} direction='vertical' align='center'>
                        <Typography.Title level={3}>{TabEmptyTitle}</Typography.Title>
                        <Typography.Text type='secondary'>{TabEmptyMessage}</Typography.Text>
                        {canImport && (
                            <Button type='primary' onClick={handleOpenModal}>
                                {GenerateButtonLabel}
                            </Button>
                        )}
                    </Space>
                </BasicEmptyListView>
                {canImport && (
                    <DebtClaimGenerationModal
                        open={isModalOpen}
                        organizationId={organizationId}
                        userId={userId}
                        onClose={handleCloseModal}
                        onSuccess={handleSuccess}
                    />
                )}
            </>
        )
    }

    return (
        <>
            <Space direction='vertical' size={24} style={{ width: '100%' }}>
                {canImport && (
                    <Button type='secondary' onClick={handleOpenModal}>
                        {GenerateButtonLabel}
                    </Button>
                )}
                <Table
                    dataSource={[lastTask]}
                    columns={columns}
                    rowKey='id'
                    pagination={false}
                />
            </Space>
            {canImport && (
                <DebtClaimGenerationModal
                    open={isModalOpen}
                    organizationId={organizationId}
                    userId={userId}
                    onClose={handleCloseModal}
                    onSuccess={handleSuccess}
                />
            )}
        </>
    )
}
