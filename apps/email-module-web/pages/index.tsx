import getConfig from 'next/config'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useIntl } from 'react-intl'

import type { GetTableData, RowSelectionOptions, RowSelectionState, TableColumn } from '@open-condo/ui'
import { ActionBar, Button, Table, renderTextWithTooltip } from '@open-condo/ui'

import { BaseLayout } from '@/domains/common/components/BaseLayout'
import { getRequest } from '@/domains/common/utils/http'
import { useLaunchParams } from '@/domains/common/utils/useLaunchParams'

import styles from './index.module.css'

type ServerItem = {
    id: string
    serverUrl: string
    description?: string | null
    username?: string | null
    port?: number | null
    createdAt?: string | null
}

type EmailSettingItem = {
    id: string
    organization_id: string
    user_id?: string
    email_login: string
    description: string | null
    smtp_host: string
    smtp_port: number
    imap_host: string
    imap_port: number
    created_at: string
    updated_at: string
}

type EmailSettingsResponse = {
    items: EmailSettingItem[]
    total: number
    limit: number
    offset: number
}

const mapEmailSettingToServerItem = (setting: EmailSettingItem): ServerItem => {


    return {
        id: setting.id,
        serverUrl: setting.smtp_host,
        description: setting.description,
        username: setting.email_login,
        port: setting.smtp_port,
        createdAt: setting.created_at,
    }
}

const IndexPage: React.FC = () => {
    const intl = useIntl()
    const router = useRouter()
    const { context: { condoContextEntityId: organizationId } } = useLaunchParams()
    const [selectedIds, setSelectedIds] = useState<RowSelectionState>([])
    const [servers, setServers] = useState<ServerItem[]>([])
    const [loading, setLoading] = useState(true)

    console.log(servers[0])

    const selectedCount = selectedIds.length

    useEffect(() => {
        const fetchServers = async () => {
            if (!organizationId) {
                setLoading(false)
                return
            }

            try {
                const response = await getRequest<EmailSettingsResponse>(
                    `/emails/email-settings/organization/${organizationId}`
                )
                setServers(response.items.map(mapEmailSettingToServerItem))
                return
            } catch (error) {
                console.error('Failed to fetch email settings:', error)
                setServers([])
            } finally {
                setLoading(false)
            }
        }

        fetchServers()
    }, [organizationId])

    const columns = useMemo<TableColumn<ServerItem>[]>(() => [
        {
            id: 'serverUrl',
            dataKey: 'serverUrl',
            header: intl.formatMessage({ id: 'pages.index.table.serverUrl' }),
            render: renderTextWithTooltip({ ellipsis: true }),
        },
        {
            id: 'description',
            dataKey: 'description',
            header: intl.formatMessage({ id: 'pages.index.table.description' }),
            render: renderTextWithTooltip({ ellipsis: true }),
        },
        {
            id: 'username',
            dataKey: 'username',
            header: intl.formatMessage({ id: 'pages.index.table.username' }),
            render: (value) => value as React.ReactNode ?? '—',
        },
        {
            id: 'port',
            dataKey: 'port',
            header: intl.formatMessage({ id: 'pages.index.table.port' }),
            render: (value) => (value ? value.toString() : '—'),
        },
        {
            id: 'createdAt',
            dataKey: 'createdAt',
            header: intl.formatMessage({ id: 'pages.index.table.createdAt' }),
            render: (value) => (value ? intl.formatDate(new Date(value as string)) : '—'),
        },
    ], [intl])

    const dataSource = useCallback<GetTableData<ServerItem>>(async () => {
        return {
            rowData: servers,
            rowCount: servers.length,
        }
    }, [servers])

    const handleAddServerClick = useCallback(() => {
        router.push('/addModule').catch(() => null)
    }, [router])

    const handleDeleteSelected = useCallback(() => {
        // TODO replace with delete request
        setSelectedIds([])
    }, [])

    const rowSelectionOptions = useMemo<RowSelectionOptions>(() => ({
        enableRowSelection: true,
        onRowSelectionChange: setSelectedIds,
    }), [])

    const actionItems = useMemo(() => {
        const items = []

        if (selectedCount > 0) {
            items.push(
                <Button
                    key='delete'
                    type='secondary'
                    danger
                    onClick={handleDeleteSelected}
                >
                    {intl.formatMessage({ id: 'pages.index.actionBar.delete' })}
                </Button>,
            )
        } else {
            items.push(
                <Button key='add' type='primary' onClick={handleAddServerClick}>
                    {intl.formatMessage({ id: 'pages.index.actionBar.add' })}
                </Button>
            )
        }

        return items
    }, [handleAddServerClick, handleDeleteSelected, intl, selectedCount])

    return (
        <BaseLayout>
            <div className={styles.page}>
                <Table
                    key={`table-${servers.length}`}
                    id='smtp-servers'
                    dataSource={dataSource}
                    columns={columns}
                    getRowId={(record) => record.id}
                    rowSelectionOptions={rowSelectionOptions}
                    columnLabels={{
                        noDataLabel: intl.formatMessage({ id: 'pages.index.table.empty' }),
                    }}
                />
                <ActionBar
                    message={intl.formatMessage({
                        id: selectedCount > 0
                            ? 'pages.index.actionBar.selection'
                            : 'pages.index.actionBar.message',
                    }, {
                        count: selectedCount,
                    })}
                    wrap={false}
                    actions={actionItems as [React.ReactElement, ...React.ReactElement[]]}
                />
            </div>
        </BaseLayout>
    )
}

export const getServerSideProps = async () => {
    const { publicRuntimeConfig } = getConfig()

    return { props: {} }
}

export default IndexPage

