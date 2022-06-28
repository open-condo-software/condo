/** @jsx jsx */
import React, { CSSProperties, useCallback, useMemo, useState } from 'react'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import { Col, Row, Typography } from 'antd'
import Input from '@condo/domains/common/components/antd/Input'
import Checkbox from '@condo/domains/common/components/antd/Checkbox'
import { FilterFilled } from '@ant-design/icons'
import { Gutter } from 'antd/lib/grid/row'
import Head from 'next/head'
import { useRouter } from 'next/router'

import { jsx } from '@emotion/react'
import { SortTicketsBy } from '@app/condo/schema'
import { useIntl } from '@core/next/intl'
import { useOrganization } from '@core/next/organization'

import { useSearch } from '@condo/domains/common/hooks/useSearch'
import { Ticket, TicketFilterTemplate, TicketExportTask } from '@condo/domains/ticket/utils/clientSchema'
import { PageHeader, PageWrapper, useLayoutContext } from '@condo/domains/common/components/containers/BaseLayout'
import { EmptyListView } from '@condo/domains/common/components/EmptyListView'
import { Button } from '@condo/domains/common/components/Button'
import { useTicketTableFilters } from '@condo/domains/ticket/hooks/useTicketTableFilters'
import { useQueryMappers } from '@condo/domains/common/hooks/useQueryMappers'
import { getPageIndexFromOffset, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { DEFAULT_PAGE_SIZE, Table } from '@condo/domains/common/components/Table/Index'
import { FiltersTooltip, useMultipleFiltersModal } from '@condo/domains/common/hooks/useMultipleFiltersModal'
import { TableFiltersContainer } from '@condo/domains/common/components/TableFiltersContainer'
import { usePaidSearch } from '@condo/domains/ticket/hooks/usePaidSearch'
import { IFilters } from '@condo/domains/ticket/utils/helpers'
import { useTableColumns } from '@condo/domains/ticket/hooks/useTableColumns'
import { useEmergencySearch } from '@condo/domains/ticket/hooks/useEmergencySearch'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'

import { fontSizes } from '@condo/domains/common/constants/style'
import { EXCEL } from '@condo/domains/common/constants/export'
import { TablePageContent } from '@condo/domains/common/components/containers/BaseLayout/BaseLayout'
import { useWarrantySearch } from '@condo/domains/ticket/hooks/useWarrantySearch'
import { useFiltersTooltipData } from '@condo/domains/ticket/hooks/useFiltersTooltipData'
import { useReturnedSearch } from '@condo/domains/ticket/hooks/useReturnedSearch'
import { TaskLauncher } from '@condo/domains/common/components/tasks/TaskLauncher'
import { getClientSideSenderInfo } from '@condo/domains/common/utils/userid.utils'
import { useAuth } from '@core/next/auth'
import { WORKER_TASK_COMPLETED, WORKER_TASK_PROCESSING } from '@condo/domains/common/constants/worker'

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
    isTicketsFetching,
    total,
    tickets,
}): JSX.Element => {
    const intl = useIntl()
    const PageTitleMessage = intl.formatMessage({ id: 'pages.condo.ticket.index.PageTitle' })
    const SearchPlaceholder = intl.formatMessage({ id: 'filters.FullSearch' })
    const EmptyListLabel = intl.formatMessage({ id: 'ticket.EmptyList.header' })
    const EmptyListMessage = intl.formatMessage({ id: 'ticket.EmptyList.title' })
    const CreateTicket = intl.formatMessage({ id: 'CreateTicket' })
    const FiltersButtonLabel = intl.formatMessage({ id: 'FiltersLabel' })
    const EmergenciesLabel = intl.formatMessage({ id: 'pages.condo.ticket.index.EmergenciesLabel' })
    const WarrantiesLabel = intl.formatMessage({ id: 'pages.condo.ticket.index.WarrantiesLabel' })
    const ReturnedLabel = intl.formatMessage({ id: 'pages.condo.ticket.index.ReturnedLabel' })
    const PaidLabel = intl.formatMessage({ id: 'pages.condo.ticket.index.PaidLabel' })
    const TicketExportTaskProgressTitle = intl.formatMessage({ id: 'tasks.TicketExportTask.progress.title' })
    const TicketExportTaskProgressDescriptionProcessing = intl.formatMessage({ id: 'tasks.TicketExportTask.progress.description.processing' })
    const TicketExportTaskProgressDescriptionCompleted = intl.formatMessage({ id: 'tasks.TicketExportTask.progress.description.completed' })

    const ExportAsExcelLabel = intl.formatMessage({ id: 'ExportAsExcel' })
    const timeZone = intl.formatters.getDateTimeFormat().resolvedOptions().timeZone

    const auth = useAuth() as { user: { id: string } }

    const { isSmall, shouldTableScroll } = useLayoutContext()
    const router = useRouter()
    const { filters } = parseQuery(router.query)

    const reduceNonEmpty = (cnt, filter) => cnt + Number((typeof filters[filter] === 'string' || Array.isArray(filters[filter])) && filters[filter].length > 0)
    const appliedFiltersCount = Object.keys(filters).reduce(reduceNonEmpty, 0)
    const { MultipleFiltersModal, ResetFiltersModalButton, setIsMultipleFiltersModalVisible } = useMultipleFiltersModal(filterMetas, TicketFilterTemplate)

    searchTicketsQuery = { ...searchTicketsQuery, ...{ deletedAt: null } }

    const loading = isTicketsFetching

    const [hoveredTicket, setHoveredTicket] = useState()

    const handleRowAction = useCallback((record) => {
        return {
            onClick: async () => {
                await router.push(`/ticket/${record.id}/`)
            },
            onMouseEnter: () => {
                setHoveredTicket(record)
            },
            onMouseLeave: () => {
                setHoveredTicket(null)
            },
        }
    }, [router])

    const [search, handleSearchChange] = useSearch<IFilters>(loading)
    const [emergency, handleEmergencyChange] = useEmergencySearch<IFilters>(loading)
    const [warranty, handleWarrantyChange] = useWarrantySearch<IFilters>(loading)
    const [returned, handleReturnedChange] = useReturnedSearch<IFilters>(loading)
    const [paid, handlePaidChange] = usePaidSearch<IFilters>(loading)
    const isNoTicketsData = !tickets.length && isEmpty(filters) && !loading

    const tooltipData = useFiltersTooltipData()

    const tableComponents = useMemo(() => ({
        body: {
            row: (props) => (
                <FiltersTooltip
                    filters={filters}
                    tooltipData={tooltipData}
                    rowObject={hoveredTicket}
                    total={total}
                    {...props}
                />
            ),
        },
    }), [tooltipData, filters, hoveredTicket, tickets, total])

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
                                createRoute="/ticket/create"
                                createLabel={CreateTicket}/>
                            : (
                                <Row gutter={ROW_GUTTER} align={'middle'} justify={'center'}>
                                    <Col span={24}>
                                        <TableFiltersContainer>
                                            <Row justify={'end'} gutter={TAP_BAR_ROW_GUTTER}>
                                                <Col flex={'auto'}>
                                                    <Row
                                                        gutter={TOP_BAR_FIRST_COLUMN_GUTTER}
                                                        align={'middle'}
                                                        justify={'start'}
                                                    >
                                                        <Col xs={24} md={8}>
                                                            <Input
                                                                placeholder={SearchPlaceholder}
                                                                onChange={(e) => {
                                                                    handleSearchChange(e.target.value)
                                                                }}
                                                                value={search}
                                                                allowClear={true}
                                                            />
                                                        </Col>
                                                        <Col xs={24} md={16}>
                                                            <Row gutter={[8, 16]}>
                                                                <Col>
                                                                    <Checkbox
                                                                        onChange={handleEmergencyChange}
                                                                        checked={emergency}
                                                                        style={CHECKBOX_STYLE}
                                                                        eventName={'TicketFilterCheckboxEmergency'}
                                                                        data-cy={'ticket__filter-isEmergency'}
                                                                    >
                                                                        {EmergenciesLabel}
                                                                    </Checkbox>
                                                                </Col>
                                                                <Col>
                                                                    <Checkbox
                                                                        onChange={handlePaidChange}
                                                                        checked={paid}
                                                                        style={CHECKBOX_STYLE}
                                                                        eventName={'TicketFilterCheckboxPaid'}
                                                                        data-cy={'ticket__filter-isPaid'}
                                                                    >
                                                                        {PaidLabel}
                                                                    </Checkbox>
                                                                </Col>
                                                                <Col>
                                                                    <Checkbox
                                                                        onChange={handleWarrantyChange}
                                                                        checked={warranty}
                                                                        style={CHECKBOX_STYLE}
                                                                        eventName={'TicketFilterCheckboxWarranty'}
                                                                        data-cy={'ticket__filter-isWarranty'}
                                                                    >
                                                                        {WarrantiesLabel}
                                                                    </Checkbox>
                                                                </Col>
                                                                <Col>
                                                                    <Checkbox
                                                                        onChange={handleReturnedChange}
                                                                        checked={returned}
                                                                        style={CHECKBOX_STYLE}
                                                                        eventName={'TicketFilterCheckboxReturned'}
                                                                        data-cy={'ticket__filter-isReturned'}
                                                                    >
                                                                        {ReturnedLabel}
                                                                    </Checkbox>
                                                                </Col>
                                                            </Row>
                                                        </Col>
                                                    </Row>
                                                </Col>
                                                <Col>
                                                    <Row justify={'end'} align={'middle'}>
                                                        {
                                                            appliedFiltersCount > 0 ? (
                                                                <Col>
                                                                    <ResetFiltersModalButton/>
                                                                </Col>
                                                            ) : null
                                                        }
                                                        <Col>
                                                            <Button
                                                                secondary
                                                                type={'sberPrimary'}
                                                                onClick={() => setIsMultipleFiltersModalVisible(true)}
                                                                data-cy={'ticket__filters-button'}
                                                            >
                                                                <FilterFilled/>
                                                                {FiltersButtonLabel}
                                                                {appliedFiltersCount > 0 ? ` (${appliedFiltersCount})` : null}
                                                            </Button>
                                                        </Col>
                                                    </Row>
                                                </Col>
                                            </Row>
                                        </TableFiltersContainer>
                                    </Col>
                                    <Col span={24}>
                                        <Table
                                            totalRows={total}
                                            loading={loading}
                                            dataSource={tickets}
                                            columns={tableColumns}
                                            onRow={handleRowAction}
                                            components={tableComponents}
                                            data-cy={'ticket__table'}
                                        />
                                    </Col>
                                    <TaskLauncher
                                        label={ExportAsExcelLabel}
                                        taskClientSchema={TicketExportTask}
                                        attrs={{
                                            dv: 1,
                                            sender: getClientSideSenderInfo(),
                                            where: searchTicketsQuery,
                                            format: EXCEL,
                                            sortBy: sortBy,
                                            timeZone,
                                            user: { connect: { id: auth.user.id } },
                                        }}
                                        translations={{
                                            title: TicketExportTaskProgressTitle,
                                            description: (taskRecord) => {
                                                // Extra field `exportedTicketsCount` over `TaskRecord` type
                                                // @ts-ignore
                                                const { status, exportedTicketsCount } = taskRecord
                                                return status === WORKER_TASK_COMPLETED
                                                    ? TicketExportTaskProgressDescriptionCompleted
                                                    : TicketExportTaskProgressDescriptionProcessing.replace('{n}', exportedTicketsCount)
                                            },
                                        }}
                                        onComplete={({ file }) => {
                                            if (window) {
                                                console.log('Downloading exported file')
                                                window.location.href = file.publicUrl
                                            }
                                        }}
                                    />
                                </Row>
                            )
                    }
                    <MultipleFiltersModal/>
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
    const { filters, sorters, offset } = parseQuery(router.query)
    const searchTicketsQuery = { ...filtersToWhere(filters), organization: { id: userOrganizationId } }

    const currentPageIndex = getPageIndexFromOffset(offset, DEFAULT_PAGE_SIZE)
    const sortBy = sortersToSortBy(sorters, TICKETS_DEFAULT_SORT_BY) as SortTicketsBy[]

    const {
        loading: isTicketsFetching,
        count: total,
        objs: tickets,
    } = Ticket.useObjects({
        sortBy,
        where: searchTicketsQuery,
        first: DEFAULT_PAGE_SIZE,
        skip: (currentPageIndex - 1) * DEFAULT_PAGE_SIZE,
    }, {
        fetchPolicy: 'network-only',
    })

    const tableColumns = useTableColumns(filterMetas, tickets)

    return (
        <TicketsPageContent
            tableColumns={tableColumns}
            searchTicketsQuery={searchTicketsQuery}
            sortBy={sortBy}
            filterMetas={filterMetas}
            isTicketsFetching={isTicketsFetching}
            total={total}
            tickets={tickets}
        />
    )
}

TicketsPage.requiredAccess = OrganizationRequired

export default TicketsPage
