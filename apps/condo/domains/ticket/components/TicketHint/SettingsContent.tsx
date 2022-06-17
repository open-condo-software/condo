import { PlusCircleOutlined } from '@ant-design/icons'
import { Col, Row, Typography } from 'antd'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { useCallback } from 'react'

import { useIntl } from '@core/next/intl'

import Input from '@condo/domains/common/components/antd/Input'
import { TableFiltersContainer } from '@condo/domains/common/components/TableFiltersContainer'
import { useSearch } from '@condo/domains/common/hooks/useSearch'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { DEFAULT_PAGE_SIZE, Table } from '@condo/domains/common/components/Table/Index'
import { getPageIndexFromOffset, getTableScrollConfig, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { useOrganization } from '@core/next/organization'
import { SortTicketHintsBy } from '@app/condo/schema'
import ActionBar from '@condo/domains/common/components/ActionBar'
import { Button } from '@condo/domains/common/components/Button'
import { useQueryMappers } from '@condo/domains/common/hooks/useQueryMappers'

import { useTicketHintTableColumns } from '@condo/domains/ticket/hooks/useTicketHintTableColumns'
import { useTicketHintTableFilters } from '@condo/domains/ticket/hooks/useTicketHintTableFilters'
import { TicketHint } from '../../utils/clientSchema'
import { IFilters } from '../../utils/helpers'

const SORTABLE_PROPERTIES = ['name']
const TICKET_HINTS_DEFAULT_SORT_BY = ['createdAt_DESC']

export const SettingsContent = () => {
    const intl = useIntl()
    const TicketHintTitle = intl.formatMessage({ id: 'Hint' })
    const SearchPlaceholder = intl.formatMessage({ id: 'filters.FullSearch' })
    const CreateHintMessage = intl.formatMessage({ id: 'pages.condo.settings.hint.createTicketHint' })

    const userOrganization = useOrganization()
    const userOrganizationId = get(userOrganization, ['organization', 'id'])

    const [search, handleSearchChange] = useSearch<IFilters>(false)
    const { shouldTableScroll } = useLayoutContext()

    const router = useRouter()
    const { filters, sorters, offset } = parseQuery(router.query)
    const filterMetas = useTicketHintTableFilters()
    const { filtersToWhere, sortersToSortBy } = useQueryMappers(filterMetas, SORTABLE_PROPERTIES)
    const searchTicketHintsQuery = { ...filtersToWhere(filters), organization: { id: userOrganizationId } }
    const currentPageIndex = getPageIndexFromOffset(offset, DEFAULT_PAGE_SIZE)
    const sortBy = sortersToSortBy(sorters, TICKET_HINTS_DEFAULT_SORT_BY) as SortTicketHintsBy[]

    const {
        loading: isTicketHintsFetching,
        count: total,
        objs: ticketHints,
    } = TicketHint.useObjects({
        sortBy,
        where: searchTicketHintsQuery,
        first: DEFAULT_PAGE_SIZE,
        skip: (currentPageIndex - 1) * DEFAULT_PAGE_SIZE,
    }, {
        fetchPolicy: 'network-only',
    })

    const tableColumns = useTicketHintTableColumns(filterMetas)

    const handleAddHintButtonClick = useCallback(async () => {
        await router.push('/settings/hint/create')
    }, [router])

    const handleRowAction = useCallback((record) => {
        return {
            onClick: async () => {
                await router.push(`/settings/hint/${record.id}/`)
            },
        }
    }, [router])

    return (
        <Row gutter={[0, 40]}>
            <Col span={24}>
                <Typography.Title level={3}>{TicketHintTitle}</Typography.Title>
            </Col>
            <Col span={24}>
                <TableFiltersContainer>
                    <Row>
                        <Col span={10}>
                            <Input
                                placeholder={SearchPlaceholder}
                                onChange={(e) => {
                                    handleSearchChange(e.target.value)
                                }}
                                value={search}
                                allowClear={true}
                            />
                        </Col>
                    </Row>
                </TableFiltersContainer>
            </Col>
            <Col span={24}>
                <Table
                    scroll={getTableScrollConfig(shouldTableScroll)}
                    totalRows={total}
                    loading={isTicketHintsFetching}
                    onRow={handleRowAction}
                    dataSource={ticketHints}
                    columns={tableColumns}
                    data-cy={'ticketHint__table'}
                />
            </Col>
            <Col span={24}>
                <ActionBar>
                    <Button
                        type={'sberDefaultGradient'}
                        icon={<PlusCircleOutlined/>}
                        onClick={handleAddHintButtonClick}
                    >
                        {CreateHintMessage}
                    </Button>
                </ActionBar>
            </Col>
        </Row>
    )
}