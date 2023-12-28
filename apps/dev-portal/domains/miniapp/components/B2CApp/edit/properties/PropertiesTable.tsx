import { Row, Col, Table } from 'antd'
import { useRouter } from 'next/router'
import React, { useCallback } from 'react'
import { useIntl } from 'react-intl'

import { EmptyTableFiller } from '@/domains/common/components/EmptyTableFiller'
import { DEFAULT_PAGE_SIZE } from '@/domains/miniapp/constants/common'
import { nonNull } from '@/domains/miniapp/utils/nonNull'
import { getCurrentPage } from '@/domains/miniapp/utils/query'

import type { AppEnvironment } from '@/lib/gql'
import type { RowProps } from 'antd'

import { useAllB2CAppPropertiesQuery } from '@/lib/gql'


type PropertiesTableProps = {
    id: string
    environment: AppEnvironment
}

const BUTTON_GUTTER: RowProps['gutter'] = [40, 40]
const FULL_COL_SPAN = 24
const PAGINATION_POSITION = ['bottomLeft' as const]

export const PropertiesTable: React.FC<PropertiesTableProps> = ({ id, environment }) => {
    const intl = useIntl()
    const AddressColumnTitle = intl.formatMessage({ id: 'apps.b2c.sections.properties.table.columns.address.title' })
    const EmptyTableMessage = intl.formatMessage({ id: 'apps.b2c.sections.properties.table.empty.message' })

    const router = useRouter()
    const { p } = router.query
    const page = getCurrentPage(p)

    const columns = [
        {
            title: AddressColumnTitle,
            key: 'address',
        },
        {
            title: ' ',
            key: 'delete',
            // Right border + 2 x padding + width
            width: `${16 * 2 + 22 + 1}px`,
        },
    ]

    const { data, loading } = useAllB2CAppPropertiesQuery({
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

    const properties = (data?.properties?.objs || []).filter(nonNull)

    const handlePaginationChange = useCallback((newPage: number) => {
        router.replace({ query: { ...router.query, p: newPage } },  undefined, { locale: router.locale })
    }, [router])

    return (
        <Row gutter={BUTTON_GUTTER}>
            <Col span={FULL_COL_SPAN}>
                <Table
                    columns={columns}
                    rowKey='id'
                    dataSource={properties}
                    bordered
                    locale={{ emptyText: <EmptyTableFiller message={EmptyTableMessage} /> }}
                    loading={loading}
                    pagination={{
                        pageSize: DEFAULT_PAGE_SIZE,
                        position: PAGINATION_POSITION,
                        showSizeChanger: false,
                        total: data?.properties?.meta.count || 0,
                        simple: true,
                        current: page,
                        onChange: handlePaginationChange,
                    }}
                />
            </Col>
        </Row>
    )
}