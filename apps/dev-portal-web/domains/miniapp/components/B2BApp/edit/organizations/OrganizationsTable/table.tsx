import { Table } from 'antd'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo } from 'react'
import { useIntl } from 'react-intl'

import { nonNull } from '@open-condo/miniapp-utils/helpers/collections'

import { EmptyTableFiller } from '@/domains/common/components/EmptyTableFiller'
import { DEFAULT_PAGE_SIZE } from '@/domains/miniapp/constants/common'
import { getCurrentPage } from '@/domains/miniapp/utils/query'

import { statusRender, organizationRender, getActionsRender } from './renders'

import type { AppEnvironment } from '@/gql'

import { useAllB2BAppContextsQuery } from '@/gql'


const PAGINATION_POSITION = ['bottomLeft' as const]

type OrganizationsTableProps = {
    id: string
    environment: AppEnvironment
}

export const OrganizationsTable: React.FC<OrganizationsTableProps> = ({ id, environment }) => {
    const intl = useIntl()
    const EmptyTableMessage = intl.formatMessage({ id: 'pages.apps.b2b.id.sections.organizations.table.empty.message' })
    const OrganizationColumnTitle = intl.formatMessage({ id: 'pages.apps.b2b.id.sections.organizations.table.columns.organization.title' })
    const StatusColumnTitle = intl.formatMessage({ id: 'pages.apps.b2b.id.sections.organizations.table.columns.status.title' })

    const router = useRouter()
    const { p } = router.query
    const page = getCurrentPage(p)

    const columns = useMemo(() => [
        {
            title: OrganizationColumnTitle,
            key: 'organization',
            dataIndex: 'organization',
            render: organizationRender,
        },
        {
            title: StatusColumnTitle,
            key: 'status',
            dataIndex: 'status',
            render: statusRender,
        },
        {
            title: ' ',
            key: 'connection',
            render: getActionsRender(id, environment),
        },
    ], [OrganizationColumnTitle, StatusColumnTitle, environment, id])

    const { data, loading } = useAllB2BAppContextsQuery({
        variables: {
            data: {
                environment,
                app: { id },
                first: DEFAULT_PAGE_SIZE,
                skip:  DEFAULT_PAGE_SIZE * (page - 1),
            },
        },
        fetchPolicy: 'cache-and-network',
    })

    const contexts = (data?.contexts?.objs ?? []).filter(nonNull)

    const handlePaginationChange = useCallback((newPage: number) => {
        router.replace({ query: { ...router.query, p: newPage } },  undefined, { locale: router.locale })
    }, [router])

    return (
        <Table
            columns={columns}
            dataSource={contexts}
            rowKey='id'
            bordered
            locale={{ emptyText: <EmptyTableFiller message={EmptyTableMessage} /> }}
            loading={loading}
            pagination={{
                pageSize: DEFAULT_PAGE_SIZE,
                position: PAGINATION_POSITION,
                showSizeChanger: false,
                total: data?.contexts?.meta.count || 0,
                simple: true,
                current: page,
                onChange: handlePaginationChange,
            }}
        />
    )
}