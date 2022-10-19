/** @jsx jsx */
import { OrganizationEmployeeSpecialization } from '@condo/domains/organization/utils/clientSchema'
import { useTicketVisibility } from '@condo/domains/ticket/contexts/TicketVisibilityContext'
import React, { CSSProperties, useCallback, useMemo, useState } from 'react'
import get from 'lodash/get'
import { Col, Row, Typography } from 'antd'
import Input from '@condo/domains/common/components/antd/Input'
import Checkbox from '@condo/domains/common/components/antd/Checkbox'
import { CheckboxChangeEvent } from 'antd/lib/checkbox/Checkbox'
import { DiffOutlined, FilterFilled } from '@ant-design/icons'
import { Gutter } from 'antd/lib/grid/row'
import Head from 'next/head'
import { useRouter } from 'next/router'

import { jsx } from '@emotion/react'
import { SortTicketsBy } from '@app/condo/schema'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import { useSearch } from '@condo/domains/common/hooks/useSearch'
import { Ticket, TicketFilterTemplate } from '@condo/domains/ticket/utils/clientSchema'
import { PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { EmptyListView } from '@condo/domains/common/components/EmptyListView'
import { Button } from '@condo/domains/common/components/Button'
import { useTicketTableFilters } from '@condo/domains/ticket/hooks/useTicketTableFilters'
import { useQueryMappers } from '@condo/domains/common/hooks/useQueryMappers'
import { getPageIndexFromOffset, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { DEFAULT_PAGE_SIZE, Table, TableRecord } from '@condo/domains/common/components/Table/Index'
import {
    MultipleFilterContextProvider,
    FiltersTooltip,
    useMultipleFiltersModal,
} from '@condo/domains/common/hooks/useMultipleFiltersModal'
import { TableFiltersContainer } from '@condo/domains/common/components/TableFiltersContainer'
import { IFilters } from '@condo/domains/ticket/utils/helpers'
import { useTableColumns } from '@condo/domains/ticket/hooks/useTableColumns'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { fontSizes } from '@condo/domains/common/constants/style'
import { EXCEL } from '@condo/domains/common/constants/export'
import { TablePageContent } from '@condo/domains/common/components/containers/BaseLayout/BaseLayout'
import { useFiltersTooltipData } from '@condo/domains/ticket/hooks/useFiltersTooltipData'
import { useAuth } from '@open-condo/next/auth'
import { useTicketExportTask } from '@condo/domains/ticket/hooks/useTicketExportTask'
import { TableComponents } from 'rc-table/lib/interface'
import { ImportWrapper } from '@condo/domains/common/components/Import/Index'
import { hasFeature } from '@condo/domains/common/components/containers/FeatureFlag'
import {
    DEFAULT_RECORDS_LIMIT_FOR_IMPORT,
    EXTENDED_RECORDS_LIMIT_FOR_IMPORT,
} from '@condo/domains/common/constants/import'
import { useImporterFunctions } from '@condo/domains/ticket/hooks/useImporterFunctions'
import { TICKET_IMPORT } from '@condo/domains/common/constants/featureflags'
import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { useBooleanAttributesSearch } from '@condo/domains/ticket/hooks/useBooleanAttributesSearch'
import { PropertyScope, PropertyScopeOrganizationEmployee, PropertyScopeProperty } from '@condo/domains/scope/utils/clientSchema'

interface ITicketIndexPage extends React.FC {
    headerAction?: JSX.Element
    requiredAccess?: React.FC
}

const PAGE_HEADER_TITLE_STYLES: CSSProperties = { margin: 0 }
const ROW_GUTTER: [Gutter, Gutter] = [0, 40]
const TAP_BAR_ROW_GUTTER: [Gutter, Gutter] = [0, 20]
const CHECKBOX_STYLE: CSSProperties = { paddingLeft: '0px', fontSize: fontSizes.content }
const TOP_BAR_FIRST_COLUMN_GUTTER: [Gutter, Gutter] = [40, 20]
const BUTTON_WRAPPER_ROW_GUTTER: [Gutter, Gutter] = [10, 0]

const TicketsTable = ({
    filterMetas,
    sortBy,
    searchTicketsQuery,
    useTableColumns,
}) => {
    const intl = useIntl()
    const timeZone = intl.formatters.getDateTimeFormat().resolvedOptions().timeZone

    const router = useRouter()
    const [isRefetching, setIsRefetching] = useState(false)

    const auth = useAuth() as { user: { id: string } }

    const { filters, offset } = parseQuery(router.query)
    const currentPageIndex = getPageIndexFromOffset(offset, DEFAULT_PAGE_SIZE)

    const { count: ticketsWithFiltersCount } = Ticket.useCount({ where: searchTicketsQuery })

    const {
        loading: isTicketsFetching,
        count: total,
        objs: tickets,
        refetch,
    } = Ticket.useObjects({
        sortBy,
        where: searchTicketsQuery,
        first: DEFAULT_PAGE_SIZE,
        skip: (currentPageIndex - 1) * DEFAULT_PAGE_SIZE,
    })

    const { TaskLauncher } = useTicketExportTask({
        where: searchTicketsQuery,
        sortBy,
        format: EXCEL,
        locale: intl.locale,
        timeZone,
        user: auth.user,
    })

    const { columns, loading: columnsLoading } = useTableColumns(filterMetas, tickets, refetch, isRefetching, setIsRefetching)

    const loading = (isTicketsFetching || columnsLoading) && !isRefetching

    const handleRowAction = useCallback((record) => {
        return {
            onClick: async () => {
                await router.push(`/ticket/${record.id}/`)
            },
        }
    }, [router])

    const tooltipData = useFiltersTooltipData()

    const tableComponents: TableComponents<TableRecord> = useMemo(() => ({
        body: {
            row: (props) => (
                <FiltersTooltip
                    filters={filters}
                    tooltipData={tooltipData}
                    total={total}
                    tickets={tickets}
                    {...props}
                />
            ),
        },
    }), [tooltipData, filters, tickets, total])

    return (
        <>
            <Col span={24}>
                <Table
                    totalRows={total}
                    loading={loading}
                    dataSource={tickets}
                    columns={columns}
                    onRow={handleRowAction}
                    components={tableComponents}
                    data-cy='ticket__table'
                />
            </Col>
            <TaskLauncher hidden={loading} disabled={ticketsWithFiltersCount === 0}/>
        </>
    )
}

const SORTABLE_PROPERTIES = ['number', 'status', 'order', 'details', 'property', 'unitName', 'assignee', 'executor', 'createdAt', 'clientName']
const TICKETS_DEFAULT_SORT_BY = ['order_ASC', 'createdAt_DESC']
const ATTRIBUTE_NAMES_To_FILTERS = ['isEmergency', 'isRegular', 'isWarranty', 'statusReopenedCounter', 'isPaid']
const CHECKBOX_WRAPPER_GUTTERS: [Gutter, Gutter] = [8, 16]
const DETAILED_LOGGING = ['status', 'source', 'attributes', 'reviewValue', 'unitType', 'contactIsNull']

const FiltersContainer = ({ TicketImportButton, filterMetas }) => {
    const intl = useIntl()
    const SearchPlaceholder = intl.formatMessage({ id: 'filters.FullSearch' })
    const FiltersButtonLabel = intl.formatMessage({ id: 'FiltersLabel' })
    const EmergenciesLabel = intl.formatMessage({ id: 'pages.condo.ticket.index.EmergenciesLabel' })
    const RegularLabel = intl.formatMessage({ id: 'pages.condo.ticket.index.RegularLabel' })
    const WarrantiesLabel = intl.formatMessage({ id: 'pages.condo.ticket.index.WarrantiesLabel' })
    const ReturnedLabel = intl.formatMessage({ id: 'pages.condo.ticket.index.ReturnedLabel' })
    const PaidLabel = intl.formatMessage({ id: 'pages.condo.ticket.index.PaidLabel' })

    const router = useRouter()
    const { filters } = parseQuery(router.query)

    const reduceNonEmpty = (cnt, filter) => cnt + Number((typeof filters[filter] === 'string' || Array.isArray(filters[filter])) && filters[filter].length > 0)
    const appliedFiltersCount = Object.keys(filters).reduce(reduceNonEmpty, 0)

    const [search, changeSearch, handleResetSearch] = useSearch<IFilters>()
    const [attributes, handleChangeAttribute, handleResetAllAttributes, handleChangeAllAttributes] = useBooleanAttributesSearch(ATTRIBUTE_NAMES_To_FILTERS)
    const { isEmergency: emergency, isRegular: regular, isWarranty: warranty, statusReopenedCounter: returned, isPaid: paid } = attributes

    const handleAttributeCheckboxChange = useCallback((attributeName: string) => (e: CheckboxChangeEvent) => {
        const isChecked = get(e, ['target', 'checked'])
        handleChangeAttribute(isChecked, attributeName)
    }, [handleChangeAttribute])

    const handleResetFilters = useCallback(() => {
        handleResetAllAttributes()
        handleResetSearch()
    }, [handleResetAllAttributes, handleResetSearch])

    const { MultipleFiltersModal, ResetFiltersModalButton, setIsMultipleFiltersModalVisible } = useMultipleFiltersModal(
        filterMetas, TicketFilterTemplate, handleResetFilters, handleChangeAllAttributes, 'Ticket', DETAILED_LOGGING
    )

    const handleOpenMultipleFilter = useCallback(() => {
        setIsMultipleFiltersModalVisible(true)
    }, [setIsMultipleFiltersModalVisible])

    const handleSearchChange = useCallback((e) => {
        changeSearch(e.target.value)
    }, [changeSearch])

    return (
        <>
            <TableFiltersContainer>
                <Row justify='end' gutter={TAP_BAR_ROW_GUTTER}>
                    <Col flex='auto'>
                        <Row
                            gutter={TOP_BAR_FIRST_COLUMN_GUTTER}
                            align='middle'
                            justify='start'
                        >
                            <Col xs={24} md={8}>
                                <Input
                                    placeholder={SearchPlaceholder}
                                    onChange={handleSearchChange}
                                    value={search}
                                    allowClear={true}
                                />
                            </Col>
                            <Col xs={24} md={16}>
                                <Row gutter={CHECKBOX_WRAPPER_GUTTERS}>
                                    <Col>
                                        <Checkbox
                                            onChange={handleAttributeCheckboxChange('isRegular')}
                                            checked={regular}
                                            style={CHECKBOX_STYLE}
                                            eventName='TicketFilterCheckboxRegular'
                                            data-cy='ticket__filter-isRegular'
                                        >
                                            {RegularLabel}
                                        </Checkbox>
                                    </Col>
                                    <Col>
                                        <Checkbox
                                            onChange={handleAttributeCheckboxChange('isEmergency')}
                                            checked={emergency}
                                            style={CHECKBOX_STYLE}
                                            eventName='TicketFilterCheckboxEmergency'
                                            data-cy='ticket__filter-isEmergency'
                                        >
                                            {EmergenciesLabel}
                                        </Checkbox>
                                    </Col>
                                    <Col>
                                        <Checkbox
                                            onChange={handleAttributeCheckboxChange('isPaid')}
                                            checked={paid}
                                            style={CHECKBOX_STYLE}
                                            eventName='TicketFilterCheckboxPaid'
                                            data-cy='ticket__filter-isPaid'
                                        >
                                            {PaidLabel}
                                        </Checkbox>
                                    </Col>
                                    <Col>
                                        <Checkbox
                                            onChange={handleAttributeCheckboxChange('isWarranty')}
                                            checked={warranty}
                                            style={CHECKBOX_STYLE}
                                            eventName='TicketFilterCheckboxWarranty'
                                            data-cy='ticket__filter-isWarranty'
                                        >
                                            {WarrantiesLabel}
                                        </Checkbox>
                                    </Col>
                                    <Col>
                                        <Checkbox
                                            onChange={handleAttributeCheckboxChange('statusReopenedCounter')}
                                            checked={returned}
                                            style={CHECKBOX_STYLE}
                                            eventName='TicketFilterCheckboxReturned'
                                            data-cy='ticket__filter-isReturned'
                                        >
                                            {ReturnedLabel}
                                        </Checkbox>
                                    </Col>
                                </Row>
                            </Col>
                        </Row>
                    </Col>
                    <Col>
                        <Row justify='end' align='middle'>
                            {
                                appliedFiltersCount > 0 ? (
                                    <Col>
                                        <ResetFiltersModalButton />
                                    </Col>
                                ) : null
                            }
                            <Col>
                                <Row gutter={BUTTON_WRAPPER_ROW_GUTTER}>
                                    <Col>
                                        {TicketImportButton}
                                    </Col>
                                    <Col>
                                        <Button
                                            secondary
                                            type='sberPrimary'
                                            onClick={handleOpenMultipleFilter}
                                            data-cy='ticket__filters-button'
                                        >
                                            <FilterFilled/>
                                            {FiltersButtonLabel}
                                            {appliedFiltersCount > 0 ? ` (${appliedFiltersCount})` : null}
                                        </Button>
                                    </Col>
                                </Row>
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </TableFiltersContainer>
            <MultipleFiltersModal />
        </>
    )
}

export const TicketsPageContent = ({
    baseTicketsQuery,
    filterMetas,
    sortableProperties,
    useTableColumns,
    showImport = false,
    baseQueryLoading = false,
}): JSX.Element => {
    const intl = useIntl()
    const PageTitleMessage = intl.formatMessage({ id: 'pages.condo.ticket.index.PageTitle' })
    const EmptyListLabel = intl.formatMessage({ id: 'ticket.EmptyList.header' })
    const EmptyListMessage = intl.formatMessage({ id: 'ticket.EmptyList.title' })
    const CreateTicket = intl.formatMessage({ id: 'CreateTicket' })
    const TicketsMessage = intl.formatMessage({ id: 'menu.Tickets' })
    const TicketReadingObjectsNameManyGenitiveMessage = intl.formatMessage({ id: 'pages.condo.ticket.import.TicketReading.objectsName.many.genitive' })

    const router = useRouter()
    const { filters, sorters } = parseQuery(router.query)
    const { filtersToWhere, sortersToSortBy } = useQueryMappers(filterMetas, sortableProperties)
    const searchTicketsQuery = useMemo(() => ({ ...baseTicketsQuery,  ...filtersToWhere(filters), ...{ deletedAt: null } }),
        [baseTicketsQuery, filters, filtersToWhere])
    const sortBy = sortersToSortBy(sorters, TICKETS_DEFAULT_SORT_BY) as SortTicketsBy[]

    const {
        count: ticketsWithoutFiltersCount,
        loading: ticketsWithoutFiltersCountLoading,
    } = Ticket.useCount({ where: baseTicketsQuery })

    const { useFlag } = useFeatureFlags()
    const isTicketImportFeatureEnabled = useFlag(TICKET_IMPORT)
    const [columns, ticketNormalizer, ticketValidator, ticketCreator] = useImporterFunctions()

    const TicketImportButton = useMemo(() => {
        return showImport && isTicketImportFeatureEnabled && (
            <ImportWrapper
                accessCheck={isTicketImportFeatureEnabled}
                domainTranslate={TicketReadingObjectsNameManyGenitiveMessage}
                columns={columns}
                objectsName={TicketsMessage}
                onFinish={undefined}
                rowValidator={ticketValidator}
                rowNormalizer={ticketNormalizer}
                objectCreator={ticketCreator}
                exampleTemplateLink='/ticket-import-example.xlsx'
                maxTableLength={
                    hasFeature('bigger_limit_for_import')
                        ? EXTENDED_RECORDS_LIMIT_FOR_IMPORT
                        : DEFAULT_RECORDS_LIMIT_FOR_IMPORT
                }
            >
                <Button
                    type='sberPrimary'
                    icon={<DiffOutlined/>}
                    secondary
                />
            </ImportWrapper>
        )
    }, [TicketReadingObjectsNameManyGenitiveMessage, TicketsMessage, columns, isTicketImportFeatureEnabled, showImport, ticketCreator, ticketNormalizer, ticketValidator])

    return (
        <>
            <Head>
                <title>{PageTitleMessage}</title>
            </Head>
            <PageWrapper>
                <PageHeader
                    title={<Typography.Title style={PAGE_HEADER_TITLE_STYLES}>{PageTitleMessage}</Typography.Title>}
                />
                <TablePageContent>
                    {
                        (!baseQueryLoading && !ticketsWithoutFiltersCountLoading && ticketsWithoutFiltersCount === 0)
                            ? <EmptyListView
                                label={EmptyListLabel}
                                message={EmptyListMessage}
                                createRoute='/ticket/create'
                                createLabel={CreateTicket}
                                button={TicketImportButton}
                            />
                            : (
                                <Row gutter={ROW_GUTTER} align='middle' justify='center'>
                                    <Col span={24}>
                                        <FiltersContainer
                                            TicketImportButton={TicketImportButton}
                                            filterMetas={filterMetas}
                                        />
                                    </Col>
                                    <TicketsTable
                                        useTableColumns={useTableColumns}
                                        filterMetas={filterMetas}
                                        sortBy={sortBy}
                                        searchTicketsQuery={searchTicketsQuery}
                                    />
                                </Row>
                            )
                    }
                </TablePageContent>
            </PageWrapper>
        </>
    )
}

const TicketsPage: ITicketIndexPage = () => {
    const filterMetas = useTicketTableFilters()

    const { ticketFilterQuery, ticketFilterQueryLoading } = useTicketVisibility()

    return (
        <MultipleFilterContextProvider>
            <TicketsPageContent
                useTableColumns={useTableColumns}
                baseTicketsQuery={ticketFilterQuery}
                baseQueryLoading={ticketFilterQueryLoading}
                filterMetas={filterMetas}
                sortableProperties={SORTABLE_PROPERTIES}
                showImport
            />
        </MultipleFilterContextProvider>
    )
}

TicketsPage.requiredAccess = OrganizationRequired

export default TicketsPage
