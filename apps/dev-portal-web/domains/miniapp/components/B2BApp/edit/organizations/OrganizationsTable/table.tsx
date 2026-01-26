import { Table, Row, Col } from 'antd'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo } from 'react'
import { useIntl } from 'react-intl'

import { nonNull } from '@open-condo/miniapp-utils/helpers/collections'

import { EmptyTableFiller } from '@/domains/common/components/EmptyTableFiller'
import { SearchInput } from '@/domains/common/components/SearchInput'
import { useDebouncedSearch } from '@/domains/common/hooks/useSearch'
import { DEFAULT_PAGE_SIZE } from '@/domains/miniapp/constants/common'
import { getCurrentPage } from '@/domains/miniapp/utils/query'

import { statusRender, organizationRender, getActionsRender } from './renders'

import type { AppEnvironment } from '@/gql'
import type { RowProps } from 'antd'

import { useAllB2BAppContextsQuery } from '@/gql'

const SEARCH_GUTTER: RowProps['gutter'] = [20, 20]
const FULL_COL_SPAN = 24
const PAGINATION_POSITION = ['bottomLeft' as const]

type OrganizationsTableProps = {
    id: string
    environment: AppEnvironment
}

const TABLE_COLUMN_MIN_WIDTHS = {
    organization: 200,
    status: 150,
    // NOTE: horizontal padding + 2x icons + 1px separator
    connection: 16 * 2 + 32 * 2 + 1,
}

export const OrganizationsTable: React.FC<OrganizationsTableProps> = ({ id, environment }) => {
    const intl = useIntl()
    const EmptyTableMessage = intl.formatMessage({ id: 'pages.apps.b2b.id.sections.organizations.table.empty.message' })
    const OrganizationColumnTitle = intl.formatMessage({ id: 'pages.apps.b2b.id.sections.organizations.table.columns.organization.title' })
    const StatusColumnTitle = intl.formatMessage({ id: 'pages.apps.b2b.id.sections.organizations.table.columns.status.title' })
    const SearchPlaceholder = intl.formatMessage({ id: 'pages.apps.b2b.id.sections.organizations.table.search.placeholder' })
    const EmptySearchMessage = intl.formatMessage({ id: 'pages.apps.b2b.id.sections.organizations.table.empty.search.message' })

    const router = useRouter()
    const { p } = router.query
    const page = getCurrentPage(p)
    const debouncedSearch = useDebouncedSearch()

    const { data, loading, refetch } = useAllB2BAppContextsQuery({
        variables: {
            data: {
                environment,
                app: { id },
                first: DEFAULT_PAGE_SIZE,
                skip:  DEFAULT_PAGE_SIZE * (page - 1),
                search: debouncedSearch,
            },
        },
        fetchPolicy: 'cache-and-network',
    })

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
            width: TABLE_COLUMN_MIN_WIDTHS['status'],
            dataIndex: 'status',
            render: statusRender,
        },
        {
            title: ' ',
            key: 'connection',
            width: TABLE_COLUMN_MIN_WIDTHS['connection'],
            render: getActionsRender(id, environment, refetch),
        },
    ], [OrganizationColumnTitle, StatusColumnTitle, environment, id, refetch])

    const scroll = useMemo(() => ({ x: Object.values(TABLE_COLUMN_MIN_WIDTHS).reduce((acc, val) => acc + val, 0) }), [])
    const minWidthStyles = useMemo(() => Object.entries(TABLE_COLUMN_MIN_WIDTHS).reduce((acc, [key, value]) => {
        acc[`--organizations-table-${key}-min-width`] = `${value}px`
        return acc
    }, {} as Record<string, string>), [])

    const contexts = (data?.contexts?.objs ?? []).filter(nonNull)

    const handlePaginationChange = useCallback((newPage: number) => {
        router.replace({ query: { ...router.query, p: newPage } },  undefined, { locale: router.locale })
    }, [router])

    const EmptyMessage = debouncedSearch ? EmptySearchMessage : EmptyTableMessage

    return (
        <Row gutter={SEARCH_GUTTER}>
            <Col span={FULL_COL_SPAN}>
                <SearchInput placeholder={SearchPlaceholder}/>
            </Col>
            <Col span={FULL_COL_SPAN}>
                <Table
                    columns={columns}
                    dataSource={contexts}
                    rowKey='id'
                    bordered
                    style={minWidthStyles}
                    scroll={scroll}
                    locale={{ emptyText: <EmptyTableFiller message={EmptyMessage} /> }}
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
            </Col>
        </Row>
    )
}