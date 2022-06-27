import { PlusCircleOutlined } from '@ant-design/icons'
import styled from '@emotion/styled'
import { Col, Row, Typography } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo } from 'react'

import { useIntl } from '@core/next/intl'
import { useOrganization } from '@core/next/organization'
import { SortTicketPropertyHintsBy } from '@app/condo/schema'

import Input from '@condo/domains/common/components/antd/Input'
import { TableFiltersContainer } from '@condo/domains/common/components/TableFiltersContainer'
import { useSearch } from '@condo/domains/common/hooks/useSearch'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { DEFAULT_PAGE_SIZE, Table } from '@condo/domains/common/components/Table/Index'
import { getPageIndexFromOffset, getTableScrollConfig, parseQuery } from '@condo/domains/common/utils/tables.utils'
import ActionBar from '@condo/domains/common/components/ActionBar'
import { Button } from '@condo/domains/common/components/Button'
import { useQueryMappers } from '@condo/domains/common/hooks/useQueryMappers'
import { useTicketPropertyHintTableFilters } from '@condo/domains/ticket/hooks/useTicketPropertyHintTableFilters'
import { useTicketPropertyHintTableColumns } from '@condo/domains/ticket/hooks/useTicketPropertyHintTableColumns'
import { TicketPropertyHint } from '@condo/domains/ticket/utils/clientSchema'
import { IFilters } from '@condo/domains/ticket/utils/helpers'

const SORTABLE_PROPERTIES = ['name']
const TICKET_HINTS_DEFAULT_SORT_BY = ['createdAt_DESC']

const StyledTable = styled(Table)`
  .ant-table-cell-ellipsis {
    white-space: inherit;
  }
`

const MEDIUM_VERTICAL_GUTTER: [Gutter, Gutter] = [0, 40]

export const SettingsContent = () => {
    const intl = useIntl()
    const TicketPropertyHintTitle = intl.formatMessage({ id: 'Hint' })
    const SearchPlaceholder = intl.formatMessage({ id: 'filters.FullSearch' })
    const CreateHintMessage = intl.formatMessage({ id: 'pages.condo.settings.hint.createTicketPropertyHint' })

    const userOrganization = useOrganization()
    const userOrganizationId = get(userOrganization, ['organization', 'id'])
    const canManageTicketPropertyHints = useMemo(() => get(userOrganization, ['link', 'role', 'canManageTicketPropertyHints']), [userOrganization])

    const [search, handleSearchChange] = useSearch<IFilters>(false)
    const { shouldTableScroll } = useLayoutContext()

    const router = useRouter()
    const { filters, sorters, offset } = parseQuery(router.query)

    const filtersMeta = useTicketPropertyHintTableFilters()

    const { filtersToWhere, sortersToSortBy } = useQueryMappers(filtersMeta, SORTABLE_PROPERTIES)
    const searchTicketPropertyHintsQuery = { ...filtersToWhere(filters), organization: { id: userOrganizationId } }
    const currentPageIndex = getPageIndexFromOffset(offset, DEFAULT_PAGE_SIZE)
    const sortBy = sortersToSortBy(sorters, TICKET_HINTS_DEFAULT_SORT_BY) as SortTicketPropertyHintsBy[]

    const {
        loading: isTicketPropertyHintsFetching,
        count: total,
        objs: ticketPropertyHints,
    } = TicketPropertyHint.useObjects({
        sortBy,
        where: searchTicketPropertyHintsQuery,
        first: DEFAULT_PAGE_SIZE,
        skip: (currentPageIndex - 1) * DEFAULT_PAGE_SIZE,
    }, {
        fetchPolicy: 'network-only',
    })

    const tableColumns = useTicketPropertyHintTableColumns(filtersMeta, ticketPropertyHints)

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

    const handleSearch = useCallback(e => {
        handleSearchChange(e.target.value)
    }, [handleSearchChange])

    return (
        <Row gutter={MEDIUM_VERTICAL_GUTTER}>
            <Col span={24}>
                <Typography.Title level={3}>{TicketPropertyHintTitle}</Typography.Title>
            </Col>
            <Col span={24}>
                <TableFiltersContainer>
                    <Row>
                        <Col span={10}>
                            <Input
                                placeholder={SearchPlaceholder}
                                onChange={handleSearch}
                                value={search}
                                allowClear
                            />
                        </Col>
                    </Row>
                </TableFiltersContainer>
            </Col>
            <Col span={24}>
                <StyledTable
                    scroll={getTableScrollConfig(shouldTableScroll)}
                    totalRows={total}
                    loading={isTicketPropertyHintsFetching}
                    onRow={handleRowAction}
                    dataSource={ticketPropertyHints}
                    columns={tableColumns}
                    data-cy={'ticketPropertyHint__table'}
                />
            </Col>
            {
                canManageTicketPropertyHints && (
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
                )
            }
        </Row>
    )
}