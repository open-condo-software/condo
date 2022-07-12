import { PlusCircleOutlined } from '@ant-design/icons'
import styled from '@emotion/styled'
import { Col, Row, Typography } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import { isEmpty } from 'lodash'
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
import {
    useTicketPropertyHintPropertyFilters,
    useTicketPropertyHintTableFilters,
} from '@condo/domains/ticket/hooks/useTicketPropertyHintTableFilters'
import { useTicketPropertyHintTableColumns } from '@condo/domains/ticket/hooks/useTicketPropertyHintTableColumns'
import { TicketPropertyHint, TicketPropertyHintProperty } from '@condo/domains/ticket/utils/clientSchema'
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

    const currentPageIndex = getPageIndexFromOffset(offset, DEFAULT_PAGE_SIZE)

    const ticketPropertyHintPropertyFiltersMeta = useTicketPropertyHintPropertyFilters()
    const {
        filtersToWhere: filtersTicketPropertyHintPropertyToWhere,
    } = useQueryMappers(ticketPropertyHintPropertyFiltersMeta, SORTABLE_PROPERTIES)
    const searchTicketPropertyHintPropertiesQuery = useMemo(() => ({
        ...filtersTicketPropertyHintPropertyToWhere(filters),
        organization: { id: userOrganizationId },
        deletedAt: null,
    }), [filters, filtersTicketPropertyHintPropertyToWhere, userOrganizationId])

    const { objs: ticketPropertyHintProperties } = TicketPropertyHintProperty.useObjects({
        where: searchTicketPropertyHintPropertiesQuery,
    })

    const hintIds = useMemo(() => ticketPropertyHintProperties
        .map(obj => get(obj, ['ticketPropertyHint', 'id']))
        .filter(Boolean)
    ,
    [ticketPropertyHintProperties])

    const filtersMeta = useTicketPropertyHintTableFilters()
    const { filtersToWhere, sortersToSortBy } = useQueryMappers(filtersMeta, SORTABLE_PROPERTIES)
    const sortBy = sortersToSortBy(sorters, TICKET_HINTS_DEFAULT_SORT_BY) as SortTicketPropertyHintsBy[]

    const searchQuery = useMemo(() => isEmpty(search) ? filtersToWhere(filters) : {
        OR: [
            {
                id_in: hintIds,
                ...filtersToWhere(filters),
            },
        ],
    }, [filters, filtersToWhere, hintIds, search])

    const searchTicketPropertyHintsQuery = useMemo(() => ({
        ...searchQuery,
        organization: { id: userOrganizationId },
    }), [searchQuery, userOrganizationId])

    const {
        loading: isTicketPropertyHintsFetching,
        count: total,
        objs: ticketPropertyHints,
    } = TicketPropertyHint.useObjects({
        sortBy,
        where: searchTicketPropertyHintsQuery,
        first: DEFAULT_PAGE_SIZE,
        skip: (currentPageIndex - 1) * DEFAULT_PAGE_SIZE,
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