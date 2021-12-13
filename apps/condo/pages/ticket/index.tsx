/** @jsx jsx */
import React, { CSSProperties, useCallback, useEffect, useState } from 'react'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import { Checkbox, Col, Input, Row, Typography } from 'antd'
import { FilterFilled } from '@ant-design/icons'
import { Gutter } from 'antd/lib/grid/row'
import Head from 'next/head'
import { useRouter } from 'next/router'

import { jsx } from '@emotion/core'
import { SortTicketsBy } from '@app/condo/schema'
import { useIntl } from '@core/next/intl'
import { useOrganization } from '@core/next/organization'

import { useSearch } from '@condo/domains/common/hooks/useSearch'
import { Ticket } from '@condo/domains/ticket/utils/clientSchema'
import { PageHeader, PageWrapper, useLayoutContext } from '@condo/domains/common/components/containers/BaseLayout'
import { EmptyListView } from '@condo/domains/common/components/EmptyListView'
import { Button } from '@condo/domains/common/components/Button'
import { TitleHeaderAction } from '@condo/domains/common/components/HeaderActions'
import { useTicketTableFilters } from '@condo/domains/ticket/hooks/useTicketTableFilters'
import { useQueryMappers } from '@condo/domains/common/hooks/useQueryMappers'
import { getPageIndexFromOffset, getTableScrollConfig, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { DEFAULT_PAGE_SIZE, Table } from '@condo/domains/common/components/Table/Index'
import { useMultipleFiltersModal } from '@condo/domains/common/hooks/useMultipleFiltersModal'
import { FocusContainer } from '@condo/domains/common/components/FocusContainer'
import { usePaidSearch } from '@condo/domains/ticket/hooks/usePaidSearch'
import { ExportToExcelActionBar } from '@condo/domains/common/components/ExportToExcelActionBar'

import { EXPORT_TICKETS_TO_EXCEL } from '@condo/domains/ticket/gql'
import { IFilters } from '@condo/domains/ticket/utils/helpers'
import { useTableColumns } from '@condo/domains/ticket/hooks/useTableColumns'
import { useEmergencySearch } from '@condo/domains/ticket/hooks/useEmergencySearch'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'

import { fontSizes } from '@condo/domains/common/constants/style'
import { TablePageContent } from '@condo/domains/common/components/containers/BaseLayout/BaseLayout'
import { FILTER_TABLE_KEYS, FiltersStorage } from '../../domains/common/utils/FiltersStorage'

interface ITicketIndexPage extends React.FC {
    headerAction?: JSX.Element
    requiredAccess?: React.FC
}

const PAGE_HEADER_TITLE_STYLES: CSSProperties = { margin: 0 }
const ROW_GUTTER: [Gutter, Gutter] = [0, 40]
const TAP_BAR_ROW_GUTTER: [Gutter, Gutter] = [0, 20]
const CHECKBOX_STYLE: CSSProperties = { paddingLeft: '0px', fontSize: fontSizes.content }
const TOP_BAR_FIRST_COLUMN_GUTTER: [Gutter, Gutter] = [40, 20]

export const TicketsPageContent = ({
    tableColumns,
    searchTicketsQuery,
    sortBy,
    filterMetas,
}) => {
    const intl = useIntl()
    const PageTitleMessage = intl.formatMessage({ id: 'pages.condo.ticket.index.PageTitle' })
    const SearchPlaceholder = intl.formatMessage({ id: 'filters.FullSearch' })
    const EmptyListLabel = intl.formatMessage({ id: 'ticket.EmptyList.header' })
    const EmptyListMessage = intl.formatMessage({ id: 'ticket.EmptyList.title' })
    const CreateTicket = intl.formatMessage({ id: 'CreateTicket' })
    const FiltersButtonLabel = intl.formatMessage({ id: 'FiltersLabel' })
    const EmergenciesLabel = intl.formatMessage({ id: 'pages.condo.ticket.index.EmergenciesLabel' })
    const PaidLabel = intl.formatMessage({ id: 'pages.condo.ticket.index.PaidLabel' })

    const { isSmall } = useLayoutContext()
    const { organization } = useOrganization()
    const router = useRouter()
    const { filters, offset } = parseQuery(router.query)
    const currentPageIndex = getPageIndexFromOffset(offset, DEFAULT_PAGE_SIZE)

    const reduceNonEmpty = (cnt, filter) => cnt + Number(Array.isArray(filters[filter]) && filters[filter].length > 0)
    const appliedFiltersCount = Object.keys(filters).reduce(reduceNonEmpty, 0)

    const [isInitialFiltersApplied, setIsInitialFiltersApplied] = useState(false)
    const { MultipleFiltersModal, ResetFiltersModalButton, setIsMultipleFiltersModalVisible } = useMultipleFiltersModal(filterMetas, FILTER_TABLE_KEYS.TICKET)
    useEffect(() => {
        FiltersStorage
            .loadFilters(organization.id, FILTER_TABLE_KEYS.TICKET, router)
            .then(() => setIsInitialFiltersApplied(true))
    }, [organization.id])

    useEffect(() => {
        FiltersStorage.saveFilters(organization.id, FILTER_TABLE_KEYS.TICKET, filters)
    }, [JSON.stringify(filters), organization.id])

    searchTicketsQuery = { ...searchTicketsQuery, ...{ deletedAt: null } }

    const {
        loading: isTicketsFetching,
        count: total,
        objs: tickets,
    } = Ticket.useObjects({
        sortBy: sortBy as SortTicketsBy[],
        where: searchTicketsQuery,
        first: DEFAULT_PAGE_SIZE,
        skip: (currentPageIndex - 1) * DEFAULT_PAGE_SIZE,
    }, {
        fetchPolicy: 'network-only',
    })

    const loading = isTicketsFetching || !isInitialFiltersApplied

    const handleRowAction = useCallback((record) => {
        return {
            onClick: async () => {
                await router.push(`/ticket/${record.id}/`)
            },
        }
    }, [])

    const [search, handleSearchChange] = useSearch<IFilters>(loading)
    const [emergency, handleEmergencyChange] = useEmergencySearch<IFilters>(loading)
    const [paid, handlePaidChange] = usePaidSearch<IFilters>(loading)
    const isNoTicketsData = !tickets.length && isEmpty(filters) && !loading

    return (
        <>
            <Head>
                <title>{PageTitleMessage}</title>
            </Head>
            <PageWrapper>
                <PageHeader title={
                    <Typography.Title style={PAGE_HEADER_TITLE_STYLES}>{PageTitleMessage}</Typography.Title>
                }/>
                <TablePageContent>
                    {
                        isNoTicketsData
                            ? <EmptyListView
                                label={EmptyListLabel}
                                message={EmptyListMessage}
                                createRoute='/ticket/create'
                                createLabel={CreateTicket} />
                            : (
                                <Row gutter={ROW_GUTTER} align={'middle'} justify={'center'}>
                                    <Col span={23}>
                                        <FocusContainer padding={'16px'}>
                                            <Row justify={'space-between'} gutter={TAP_BAR_ROW_GUTTER}>
                                                <Col xs={24} lg={15}>
                                                    <Row gutter={TOP_BAR_FIRST_COLUMN_GUTTER} align={'middle'}>
                                                        <Col xs={24} lg={11}>
                                                            <Input
                                                                placeholder={SearchPlaceholder}
                                                                onChange={(e) => {
                                                                    handleSearchChange(e.target.value)
                                                                }}
                                                                value={search}
                                                            />
                                                        </Col>
                                                        <Col xs={24} lg={5}>
                                                            <Checkbox
                                                                onChange={handleEmergencyChange}
                                                                checked={emergency}
                                                                style={CHECKBOX_STYLE}
                                                            >
                                                                {EmergenciesLabel}
                                                            </Checkbox>
                                                        </Col>
                                                        <Col xs={24} lg={5}>
                                                            <Checkbox
                                                                onChange={handlePaidChange}
                                                                checked={paid}
                                                                style={CHECKBOX_STYLE}
                                                            >
                                                                {PaidLabel}
                                                            </Checkbox>
                                                        </Col>
                                                    </Row>
                                                </Col>
                                                <Col>
                                                    <Row>
                                                        {
                                                            appliedFiltersCount > 0 ? (
                                                                <Col>
                                                                    <ResetFiltersModalButton
                                                                        filterTableKey={FILTER_TABLE_KEYS.TICKET}
                                                                    />
                                                                </Col>
                                                            ) : null
                                                        }
                                                        <Col>
                                                            <Button
                                                                secondary
                                                                type={'sberPrimary'}
                                                                onClick={() => setIsMultipleFiltersModalVisible(true)}
                                                            >
                                                                <FilterFilled/>
                                                                {FiltersButtonLabel}
                                                                {appliedFiltersCount > 0 ? ` (${appliedFiltersCount})` : null}
                                                            </Button>
                                                        </Col>
                                                    </Row>
                                                </Col>
                                            </Row>
                                        </FocusContainer>
                                    </Col>
                                    <Col span={24}>
                                        <Table
                                            scroll={getTableScrollConfig(isSmall)}
                                            totalRows={total}
                                            loading={loading}
                                            dataSource={tickets}
                                            columns={tableColumns}
                                            onRow={handleRowAction}
                                        />
                                    </Col>
                                    <ExportToExcelActionBar
                                        hidden={isSmall}
                                        searchObjectsQuery={searchTicketsQuery}
                                        sortBy={sortBy}
                                        exportToExcelQuery={EXPORT_TICKETS_TO_EXCEL}
                                    />
                                </Row>
                            )
                    }
                    <MultipleFiltersModal />
                </TablePageContent>
            </PageWrapper>
        </>
    )
}

const SORTABLE_PROPERTIES = ['number', 'status', 'order', 'details', 'property', 'unitName', 'assignee', 'executor', 'createdAt', 'clientName']
const TICKETS_DEFAULT_SORT_BY = ['order_ASC', 'createdAt_DESC']

const TicketsPage: ITicketIndexPage = () => {
    const userOrganization = useOrganization()
    const userOrganizationId = get(userOrganization, ['organization', 'id'])
    const filterMetas = useTicketTableFilters()
    const { filtersToWhere, sortersToSortBy } = useQueryMappers(filterMetas, SORTABLE_PROPERTIES)
    const router = useRouter()
    const { filters, sorters } = parseQuery(router.query)
    const tableColumns = useTableColumns(filterMetas)
    const searchTicketsQuery = { ...filtersToWhere(filters), organization: { id: userOrganizationId } }
    
    return (
        <TicketsPageContent
            tableColumns={tableColumns}
            searchTicketsQuery={searchTicketsQuery}
            sortBy={sortersToSortBy(sorters, TICKETS_DEFAULT_SORT_BY)}
            filterMetas={filterMetas}
        />
    )
}

TicketsPage.headerAction = <TitleHeaderAction descriptor={{ id: 'menu.ControlRoom' }}/>
TicketsPage.requiredAccess = OrganizationRequired

export default TicketsPage
