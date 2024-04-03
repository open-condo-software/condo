/** @jsx jsx */
import { useApolloClient } from '@apollo/client'
import { SortTicketsBy, Ticket as ITicket, TicketStatusTypeType } from '@app/condo/schema'
import { jsx } from '@emotion/react'
import styled from '@emotion/styled'
import { Col, Row, RowProps } from 'antd'
import { CheckboxChangeEvent } from 'antd/lib/checkbox/Checkbox'
import { TableRowSelection } from 'antd/lib/table/interface'
import debounce from 'lodash/debounce'
import get from 'lodash/get'
import isEqual from 'lodash/isEqual'
import isNull from 'lodash/isNull'
import isNumber from 'lodash/isNumber'
import isString from 'lodash/isString'
import omit from 'lodash/omit'
import pick from 'lodash/pick'
import Head from 'next/head'
import Link from 'next/link'
import { NextRouter, useRouter } from 'next/router'
import { TableComponents } from 'rc-table/lib/interface'
import React, { CSSProperties, Key, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useDeepCompareEffect } from '@open-condo/codegen/utils/useDeepCompareEffect'
import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { Search, Close, Phone } from '@open-condo/icons'
import { useLazyQuery } from '@open-condo/next/apollo'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { ActionBar, Typography, Button, RadioGroup, Radio, Space } from '@open-condo/ui'
// TODO(DOMA-4844): Replace with @open-condo/ui/colors
import { colors } from '@open-condo/ui/dist/colors'

import Checkbox from '@condo/domains/common/components/antd/Checkbox'
import Input from '@condo/domains/common/components/antd/Input'
import { PageHeader, PageWrapper, useLayoutContext } from '@condo/domains/common/components/containers/BaseLayout'
import { TablePageContent } from '@condo/domains/common/components/containers/BaseLayout/BaseLayout'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { EmptyListContent } from '@condo/domains/common/components/EmptyListContent'
import { ImportWrapper } from '@condo/domains/common/components/Import/Index'
import { Loader } from '@condo/domains/common/components/Loader'
import { DEFAULT_PAGE_SIZE, Table, TableRecord } from '@condo/domains/common/components/Table/Index'
import { TableFiltersContainer } from '@condo/domains/common/components/TableFiltersContainer'
import { useTracking } from '@condo/domains/common/components/TrackingContext'
import { useWindowTitleContext, WindowTitleContextProvider } from '@condo/domains/common/components/WindowTitleContext'
import { EMOJI } from '@condo/domains/common/constants/emoji'
import { EXCEL } from '@condo/domains/common/constants/export'
import { TICKET_IMPORT } from '@condo/domains/common/constants/featureflags'
import { fontSizes } from '@condo/domains/common/constants/style'
import { useAudio } from '@condo/domains/common/hooks/useAudio'
import { useCheckboxSearch } from '@condo/domains/common/hooks/useCheckboxSearch'
import { useContainerSize } from '@condo/domains/common/hooks/useContainerSize'
import { useGlobalHints } from '@condo/domains/common/hooks/useGlobalHints'
import {
    MultipleFilterContextProvider,
    FiltersTooltip,
    useMultipleFiltersModal,
} from '@condo/domains/common/hooks/useMultipleFiltersModal'
import { usePreviousQueryParams } from '@condo/domains/common/hooks/usePreviousQueryParams'
import { useQueryMappers } from '@condo/domains/common/hooks/useQueryMappers'
import { useSearch } from '@condo/domains/common/hooks/useSearch'
import { getFiltersQueryData } from '@condo/domains/common/utils/filters.utils'
import { updateQuery } from '@condo/domains/common/utils/helpers'
import { getPageIndexFromOffset, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { TicketReadPermissionRequired } from '@condo/domains/ticket/components/PageAccess'
import { TicketStatusFilter } from '@condo/domains/ticket/components/TicketStatusFilter/TicketStatusFilter'
import { MAX_TICKET_BLANKS_EXPORT } from '@condo/domains/ticket/constants/export'
import {
    AutoRefetchTicketsContextProvider,
    useAutoRefetchTickets,
} from '@condo/domains/ticket/contexts/AutoRefetchTicketsContext'
import {
    FavoriteTicketsContextProvider,
    useFavoriteTickets,
} from '@condo/domains/ticket/contexts/FavoriteTicketsContext'
import { useTicketVisibility } from '@condo/domains/ticket/contexts/TicketVisibilityContext'
import { Ticket as TicketGQL } from '@condo/domains/ticket/gql'
import { useBooleanAttributesSearch } from '@condo/domains/ticket/hooks/useBooleanAttributesSearch'
import { useFiltersTooltipData } from '@condo/domains/ticket/hooks/useFiltersTooltipData'
import { useImporterFunctions } from '@condo/domains/ticket/hooks/useImporterFunctions'
import { useTableColumns } from '@condo/domains/ticket/hooks/useTableColumns'
import { useTicketExportToExcelTask } from '@condo/domains/ticket/hooks/useTicketExportToExcelTask'
import { useTicketExportToPdfTask } from '@condo/domains/ticket/hooks/useTicketExportToPdfTask'
import { useTicketTableFilters } from '@condo/domains/ticket/hooks/useTicketTableFilters'
import { CallRecordFragment, Ticket, TicketFilterTemplate } from '@condo/domains/ticket/utils/clientSchema'
import { GET_TICKETS_COUNT_QUERY } from '@condo/domains/ticket/utils/clientSchema/search'
import { IFilters } from '@condo/domains/ticket/utils/helpers'


interface ITicketIndexPage extends React.FC {
    headerAction?: JSX.Element
    requiredAccess?: React.FC
}

type TicketType = 'all' | 'own' | 'favorite'

const LARGE_VERTICAL_ROW_GUTTER: RowProps['gutter'] = [0, 40]
const MEDIUM_VERTICAL_ROW_GUTTER: RowProps['gutter'] = [0, 24]
const HEADER_STYLES: CSSProperties = { padding: 0 }
const CHECKBOX_STYLE: CSSProperties = { paddingLeft: '0px', fontSize: fontSizes.label }
const DEBOUNCE_TIMEOUT = 400

const StyledTable = styled(Table)`
  .ant-checkbox-input {
    width: 50px;
    height: calc(100% + 32px);
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  .ant-table-scroll-horizontal .ant-checkbox-input {
    width: 40px;
  }

  .comments-column {
    padding: 0;
    padding-top: 14px;
    width: 8px;
  }

  .number-column {
    padding-left: 0;
  }

  .favorite-column {
    padding: 16px 16px 16px 8px;
  }

  .ant-table-selection-column {
    padding-top: 12px;
  }
`

const getInitialSelectedTicketKeys = (router: NextRouter) => {
    if ('selectedTicketIds' in router.query && isString(router.query.selectedTicketIds)) {
        try {
            return JSON.parse(router.query.selectedTicketIds as string)
        } catch (error) {
            console.warn('Failed to parse property value "selectedTicketIds"', error)
            return []
        }
    }
    return []
}

const TicketTable = ({
    sortBy,
    total,
    tickets,
    columns,
    filters,
    loading,
    ticketsWithFiltersCount,
    searchTicketsQuery,
    TicketImportButton,
}) => {
    const intl = useIntl()
    const CancelSelectedTicketLabel = intl.formatMessage({ id: 'global.cancelSelection' })
    const CountSelectedTicketLabel = intl.formatMessage({ id: 'pages.condo.ticket.index.CountSelectedTicket' })

    const { getTrackingWrappedCallback } = useTracking()
    const timeZone = intl.formatters.getDateTimeFormat().resolvedOptions().timeZone

    const auth = useAuth() as { user: { id: string } }
    const user = get(auth, 'user')

    const router = useRouter()

    const tooltipData = useFiltersTooltipData()

    const [selectedTicketKeys, setSelectedTicketKeys] = useState<Key[]>(() => getInitialSelectedTicketKeys(router))

    const changeQuery = useMemo(() => debounce(async (router: NextRouter, selectedTicketKeys: React.Key[]) => {
        await updateQuery(router, { newParameters: { selectedTicketIds: selectedTicketKeys } }, {
            routerAction: 'replace',
            resetOldParameters: false,
        })
    }, DEBOUNCE_TIMEOUT), [])

    const updateSelectedTicketKeys = useCallback((selectedTicketKeys: Key[]) => {
        setSelectedTicketKeys(selectedTicketKeys)
        changeQuery(router, selectedTicketKeys)
    }, [changeQuery, router])

    const selectedRowKeysByPage = useMemo(() => {
        return tickets.filter(ticket => selectedTicketKeys.includes(ticket.id)).map(tickets => tickets.id)
    }, [selectedTicketKeys, tickets])

    const isSelectedAllRowsByPage = !loading && selectedRowKeysByPage.length > 0 && selectedRowKeysByPage.length === tickets.length
    const isSelectedSomeRowsByPage = !loading && selectedRowKeysByPage.length > 0 && selectedRowKeysByPage.length < tickets.length

    const selectedOneTicketId = useMemo(() => {
        if (selectedTicketKeys.length !== 1) return undefined
        return String(selectedTicketKeys[0])
    }, [selectedTicketKeys])

    const { TicketsExportToXlsxButton } = useTicketExportToExcelTask({
        where: searchTicketsQuery,
        sortBy,
        format: EXCEL,
        locale: intl.locale,
        timeZone,
        user: auth.user,
    })

    const { TicketBlanksExportToPdfModal, TicketBlanksExportToPdfButton } = useTicketExportToPdfTask({
        ticketId: selectedOneTicketId,
        where: {
            ...searchTicketsQuery,
            'id_in': selectedTicketKeys as string[],
        },
        sortBy,
        user,
        timeZone,
        locale: intl.locale,
        eventNamePrefix: 'TicketIndex',
    })

    const handleRowAction = useCallback((record) => {
        return {
            onClick: async () => {
                await router.push(`/ticket/${record.id}/`)
            },
        }
    }, [router])

    const handleResetSelectedTickets = useCallback(() => {
        updateSelectedTicketKeys([])
    }, [updateSelectedTicketKeys])

    const handleSelectAllRowsByPage = useCallback((e: CheckboxChangeEvent) => {
        const checked = e.target.checked
        if (checked) {
            const newSelectedTicketKeys = tickets
                .filter(ticket => !selectedRowKeysByPage.includes(ticket.id))
                .map(ticket => ticket.id)
            updateSelectedTicketKeys([...selectedTicketKeys, ...newSelectedTicketKeys])
        } else {
            updateSelectedTicketKeys(selectedTicketKeys.filter(key => !selectedRowKeysByPage.includes(key)))
        }
    }, [tickets, updateSelectedTicketKeys, selectedTicketKeys, selectedRowKeysByPage])

    const handleSelectRow: (record: ITicket, checked: boolean) => void = useCallback((record, checked) => {
        const selectedKey = record.id
        if (checked) {
            updateSelectedTicketKeys([...selectedTicketKeys, selectedKey])
        } else {
            updateSelectedTicketKeys(selectedTicketKeys.filter(key => selectedKey !== key))
        }
    }, [selectedTicketKeys, updateSelectedTicketKeys])

    const handleSelectRowWithTracking = useMemo(
        () => getTrackingWrappedCallback('TicketTableCheckboxSelectRow', null, handleSelectRow),
        [getTrackingWrappedCallback, handleSelectRow])

    const rowSelection: TableRowSelection<ITicket> = useMemo(() => ({
        selectedRowKeys: selectedRowKeysByPage,
        fixed: true,
        onSelect: handleSelectRowWithTracking,
        columnTitle: (
            <Checkbox
                checked={isSelectedAllRowsByPage}
                indeterminate={isSelectedSomeRowsByPage}
                onChange={handleSelectAllRowsByPage}
                eventName='TicketTableCheckboxSelectAll'
            />
        ),
    }), [handleSelectAllRowsByPage, handleSelectRowWithTracking, isSelectedAllRowsByPage, isSelectedSomeRowsByPage, selectedRowKeysByPage])

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

    useDeepCompareEffect(() => {
        if (total === null) return
        setSelectedTicketKeys([])
    }, [filters, sortBy])

    return (
        <Row gutter={[0, 40]}>
            <Col span={24}>
                <StyledTable
                    totalRows={total}
                    loading={loading}
                    dataSource={loading ? null : tickets}
                    columns={columns}
                    onRow={handleRowAction}
                    components={tableComponents}
                    data-cy='ticket__table'
                    rowSelection={rowSelection}
                    sticky
                />
            </Col>
            {
                !loading && ticketsWithFiltersCount > 0 && (
                    <Col span={24}>
                        <ActionBar
                            message={selectedTicketKeys.length > 0 && `${CountSelectedTicketLabel}: ${selectedTicketKeys.length}`}
                            actions={[
                                selectedTicketKeys.length > 0 && (
                                    <TicketBlanksExportToPdfButton
                                        key='exportToPdf'
                                        disabled={selectedTicketKeys.length > MAX_TICKET_BLANKS_EXPORT}
                                    />
                                ),
                                selectedTicketKeys.length < 1 && TicketImportButton && TicketImportButton,
                                // nosemgrep: generic.secrets.gitleaks.generic-api-key.generic-api-key
                                selectedTicketKeys.length < 1 && <TicketsExportToXlsxButton key='exportToXlsx'/>,
                                selectedTicketKeys.length > 0 && (
                                    <Button
                                        key='cancelSelectedTicket'
                                        type='secondary'
                                        children={CancelSelectedTicketLabel}
                                        onClick={handleResetSelectedTickets}
                                        icon={<Close size='medium'/>}
                                    />
                                ),
                            ]}
                        />
                    </Col>
                )
            }
            {TicketBlanksExportToPdfModal}
        </Row>
    )
}

const TicketsTableContainer = ({
    filterMetas,
    sortBy,
    searchTicketsQuery,
    useTableColumns,
    baseQueryLoading,
    TicketImportButton,
}) => {
    const intl = useIntl()

    const { count: ticketsWithFiltersCount } = Ticket.useCount({ where: searchTicketsQuery })

    const router = useRouter()
    const { filters, offset } = useMemo(() => parseQuery(router.query), [router.query])

    const [isRefetching, setIsRefetching] = useState(false)
    const ticketsCountRef = useRef(null)
    const audio = useAudio()
    const { setTitleConfig, unreadCount } = useWindowTitleContext()

    const currentPageIndex = useMemo(() => getPageIndexFromOffset(offset, DEFAULT_PAGE_SIZE), [offset])

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

    const [loadNewTicketCount] = useLazyQuery(TicketGQL.GET_COUNT_OBJS_QUERY, {
        onCompleted: ({ meta: { count } }) => {
            if (!isNull(ticketsCountRef.current) && ticketsCountRef.current < count) {
                const totalNewTicketsCount = count - ticketsCountRef.current + unreadCount

                const iconPath = totalNewTicketsCount > 9
                    ? '/favicons/infinity.svg'
                    : `/favicons/${totalNewTicketsCount}.svg`
                const newTitle = totalNewTicketsCount > 9
                    ? intl.formatMessage({ id: 'pages.condo.ticket.index.manyNewTicketsTitle' })
                    : intl.formatMessage({ id: 'pages.condo.ticket.index.fewNewTicketsTitle' }, { count: totalNewTicketsCount })

                setTitleConfig({ label: newTitle, iconPath, count: totalNewTicketsCount })
                audio.playNewItemsFetchedSound()
            }
            ticketsCountRef.current = count
        },
        onError: () => {
            ticketsCountRef.current = null
        },
        fetchPolicy: 'network-only',
        variables: {
            where: {
                AND: [
                    pick(searchTicketsQuery, 'organization'), { status: { type: TicketStatusTypeType.NewOrReopened } },
                ],
            },
            first: DEFAULT_PAGE_SIZE,
        },
    })

    const refetchTickets = useCallback(async () => {
        await refetch()
        await loadNewTicketCount()
    }, [loadNewTicketCount, refetch])

    const {
        columns,
        loading: columnsLoading,
    } = useTableColumns(filterMetas, tickets, refetchTickets, isRefetching, setIsRefetching)

    useEffect(() => {
        loadNewTicketCount()
    }, [loadNewTicketCount])

    const loading = (isTicketsFetching || columnsLoading || baseQueryLoading) && !isRefetching

    return (
        <TicketTable
            filters={filters}
            total={total}
            tickets={tickets}
            loading={loading}
            columns={columns}
            ticketsWithFiltersCount={ticketsWithFiltersCount}
            searchTicketsQuery={searchTicketsQuery}
            sortBy={sortBy}
            TicketImportButton={TicketImportButton}
        />
    )
}

const SORTABLE_PROPERTIES = ['number', 'status', 'order', 'details', 'property', 'unitName', 'assignee', 'executor', 'createdAt', 'clientName']
const TICKETS_DEFAULT_SORT_BY = ['order_ASC', 'createdAt_DESC']
const ATTRIBUTE_NAMES_To_FILTERS = ['isEmergency', 'isRegular', 'isWarranty', 'statusReopenedCounter', 'isPayable']
const CHECKBOX_WRAPPER_GUTTERS: RowProps['gutter'] = [8, 16]
// todo(doma-5776): update amplitude
const DETAILED_LOGGING = ['status', 'source', 'attributes', 'feedbackValue', 'qualityControlValue', 'unitType', 'contactIsNull']

const SMALL_HORIZONTAL_GUTTER: RowProps['gutter'] = [10, 0]
const TICKET_STATUS_FILTER_CONTAINER_ROW_STYLES: CSSProperties = {
    flexWrap: 'nowrap',
    overflowX: 'auto',
    paddingBottom: '20px',
}
const ALL_TICKETS_COUNT_CONTAINER_STYLES: CSSProperties = {
    display: 'flex',
    whiteSpace: 'nowrap',
    alignItems: 'center',
}
const LOADER_STYLES = { display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: '20px' }

const TicketStatusFilterContainer = ({ searchTicketsQuery, searchTicketsWithoutStatusQuery }) => {
    const intl = useIntl()
    const OpenedTicketsMessage = intl.formatMessage({ id: 'ticket.status.OPEN.many' })
    const InProgressTicketsMessage = intl.formatMessage({ id: 'ticket.status.IN_PROGRESS.many' })
    const CanceledTicketsMessage = intl.formatMessage({ id: 'ticket.status.DECLINED.many' })
    const CompletedTicketsMessage = intl.formatMessage({ id: 'ticket.status.COMPLETED.many' })
    const DeferredTicketsMessage = intl.formatMessage({ id: 'ticket.status.DEFERRED.many' })
    const ClosedTicketsMessage = intl.formatMessage({ id: 'ticket.status.CLOSED.many' })

    const client = useApolloClient()

    const [count, setCount] = useState<Record<TicketStatusTypeType, { count: number }> & { all: { count: number } }>()

    const searchTicketsQueryRef = useRef(searchTicketsQuery)
    useEffect(() => {
        searchTicketsQueryRef.current = searchTicketsQuery
    }, [searchTicketsQuery])

    useDeepCompareEffect(() => {
        client.query({
            query: GET_TICKETS_COUNT_QUERY,
            variables: {
                where: searchTicketsQuery,
                whereWithoutStatuses: searchTicketsWithoutStatusQuery,
            },
            fetchPolicy: 'network-only',
        }).then(({ data }) => {
            if (isEqual(searchTicketsQueryRef.current, searchTicketsQuery)) {
                setCount(data)
            }
        })
            .catch(e => console.error(e))
    }, [searchTicketsQuery, searchTicketsWithoutStatusQuery])

    const loading = count === undefined

    return loading ? <Loader style={LOADER_STYLES}/> : (
        <Row gutter={SMALL_HORIZONTAL_GUTTER} style={TICKET_STATUS_FILTER_CONTAINER_ROW_STYLES}>
            <Col style={ALL_TICKETS_COUNT_CONTAINER_STYLES}>
                <Typography.Text size='large' strong>
                    {
                        intl.formatMessage({ id: 'TicketsCount' }, {
                            ticketsCount: count.all.count,
                        })
                    }
                </Typography.Text>
            </Col>
            <Col>
                <TicketStatusFilter
                    title={OpenedTicketsMessage}
                    type={TicketStatusTypeType.NewOrReopened}
                    count={count}
                />
            </Col>
            <Col>
                <TicketStatusFilter
                    title={InProgressTicketsMessage}
                    type={TicketStatusTypeType.Processing}
                    count={count}
                />
            </Col>
            <Col>
                <TicketStatusFilter
                    title={CompletedTicketsMessage}
                    type={TicketStatusTypeType.Completed}
                    count={count}
                />
            </Col>
            <Col>
                <TicketStatusFilter
                    title={DeferredTicketsMessage}
                    type={TicketStatusTypeType.Deferred}
                    count={count}
                />
            </Col>
            <Col>
                <TicketStatusFilter
                    title={CanceledTicketsMessage}
                    type={TicketStatusTypeType.Canceled}
                    count={count}
                />
            </Col>
            <Col>
                <TicketStatusFilter
                    title={ClosedTicketsMessage}
                    type={TicketStatusTypeType.Closed}
                    count={count}
                />
            </Col>
        </Row>
    )
}

const FILTERS_CONTAINER_ROW_GUTTER: RowProps['gutter'] = [20, 20]
const CHECKBOX_WRAPPER_STYLES: CSSProperties = { flexWrap: 'nowrap', overflowX: 'auto', overflowY: 'hidden' }
const FILTERS_BUTTON_ROW_GUTTER: RowProps['gutter'] = [16, 10]
const FILTERS_BUTTON_ROW_STYLES: CSSProperties = { flexWrap: 'nowrap' }
const RESET_FILTERS_BUTTON_STYLES: CSSProperties = { padding: 0 }

const FiltersContainer = ({ filterMetas }) => {
    const intl = useIntl()
    const SearchPlaceholder = intl.formatMessage({ id: 'filters.FullSearch' })
    const EmergenciesLabel = intl.formatMessage({ id: 'pages.condo.ticket.index.EmergenciesLabel' })
    const RegularLabel = intl.formatMessage({ id: 'pages.condo.ticket.index.RegularLabel' })
    const WarrantiesLabel = intl.formatMessage({ id: 'pages.condo.ticket.index.WarrantiesLabel' })
    const ReturnedLabel = intl.formatMessage({ id: 'pages.condo.ticket.index.ReturnedLabel' })
    const PayableLabel = intl.formatMessage({ id: 'pages.condo.ticket.index.PayableLabel' })
    const ExpiredLabel = intl.formatMessage({ id: 'pages.condo.ticket.index.ExpiredLabel' })

    const router = useRouter()
    const { filters } = parseQuery(router.query)
    const [{ width: contentWidth }, setRef] = useContainerSize()

    const reduceNonEmpty = (cnt, filter) => cnt + Number((typeof filters[filter] === 'string' || Array.isArray(filters[filter])) && filters[filter].length > 0)
    const appliedFiltersCount = Object.keys(filters).reduce(reduceNonEmpty, 0)

    const [search, changeSearch, handleResetSearch] = useSearch<IFilters>()
    const [attributes, handleChangeAttribute, handleResetAllAttributes, handleChangeAllAttributes] = useBooleanAttributesSearch(ATTRIBUTE_NAMES_To_FILTERS)
    const {
        isEmergency: emergency,
        isRegular: regular,
        isWarranty: warranty,
        statusReopenedCounter: returned,
        isPayable: payable,
    } = attributes
    const [
        isCompletedAfterDeadline,
        handleChangeIsCompletedAfterDeadline,
        handleResetIsCompletedAfterDeadline,
        handleUpdateIsCompletedAfterDeadline,
    ] = useCheckboxSearch('isCompletedAfterDeadline')

    const handleAttributeCheckboxChange = useCallback((attributeName: string) => (e: CheckboxChangeEvent) => {
        const isChecked = get(e, ['target', 'checked'])
        handleChangeAttribute(isChecked, attributeName)
    }, [handleChangeAttribute])

    const handleResetFilters = useCallback(() => {
        handleResetAllAttributes()
        handleResetSearch()
        handleResetIsCompletedAfterDeadline()
    }, [handleResetAllAttributes, handleResetSearch, handleResetIsCompletedAfterDeadline])

    const handleSubmitFilters = useCallback((filters) => {
        handleChangeAllAttributes(filters)
        handleUpdateIsCompletedAfterDeadline(filters)
    }, [handleChangeAllAttributes, handleUpdateIsCompletedAfterDeadline])

    const { MultipleFiltersModal, ResetFiltersModalButton, OpenFiltersButton } = useMultipleFiltersModal(
        filterMetas, TicketFilterTemplate, handleResetFilters, handleSubmitFilters, 'Ticket', DETAILED_LOGGING
    )

    const handleSearchChange = useCallback((e) => {
        changeSearch(e.target.value)
    }, [changeSearch])

    let checkboxColSpan = 24
    let filterButtonColSpan = 24

    const isXlContainerSize = contentWidth >= 980
    const isXxlContainerSize = contentWidth >= 1288

    if (isXlContainerSize) {
        checkboxColSpan = 17
        filterButtonColSpan = 7
    }

    if (isXxlContainerSize) {
        checkboxColSpan = 18
        filterButtonColSpan = 6
    }

    return (
        <>
            <TableFiltersContainer ref={setRef}>
                <Row gutter={FILTERS_CONTAINER_ROW_GUTTER} align='middle'>
                    <Col span={24}>
                        <Input
                            placeholder={SearchPlaceholder}
                            onChange={handleSearchChange}
                            value={search}
                            allowClear
                            suffix={<Search size='medium' color={colors.gray[7]}/>}
                        />
                    </Col>
                    <Col span={checkboxColSpan}>
                        <Row
                            align='middle'
                            gutter={CHECKBOX_WRAPPER_GUTTERS}
                        >
                            <Col span={24}>
                                <Row gutter={CHECKBOX_WRAPPER_GUTTERS} style={!isXlContainerSize ? CHECKBOX_WRAPPER_STYLES : null}>
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
                                            onChange={handleAttributeCheckboxChange('isPayable')}
                                            checked={payable}
                                            style={CHECKBOX_STYLE}
                                            eventName='TicketFilterCheckboxPayable'
                                            data-cy='ticket__filter-isPayable'
                                        >
                                            {PayableLabel}
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
                                    <Col>
                                        <Checkbox
                                            onChange={(event) => handleChangeIsCompletedAfterDeadline(get(event, 'target.checked', false))}
                                            checked={isCompletedAfterDeadline}
                                            style={CHECKBOX_STYLE}
                                            eventName='TicketFilterCheckboxIsCompletedAfterDeadline'
                                            data-cy='ticket__filter-isCompletedAfterDeadline'
                                            children={ExpiredLabel}
                                        />
                                    </Col>
                                </Row>
                            </Col>
                        </Row>
                    </Col>
                    <Col span={filterButtonColSpan} style={{ alignSelf: 'end' }}>
                        <Row justify={isXlContainerSize ? 'end' : 'start'} align='bottom'>
                            <Col>
                                <Row align='middle' gutter={FILTERS_BUTTON_ROW_GUTTER} style={FILTERS_BUTTON_ROW_STYLES}>
                                    {
                                        appliedFiltersCount > 0 && (
                                            <Col>
                                                <ResetFiltersModalButton style={RESET_FILTERS_BUTTON_STYLES}/>
                                            </Col>
                                        )
                                    }
                                    <Col>
                                        <OpenFiltersButton />
                                    </Col>
                                </Row>
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </TableFiltersContainer>
            <MultipleFiltersModal/>
        </>
    )
}

export const TicketsPageContent = ({
    filterMetas,
    useTableColumns,
    baseTicketsQuery,
    sortableProperties,
    showImport = false,
    loading = false,
    ticketsWithoutFiltersCount,
    error,
}): JSX.Element => {
    const intl = useIntl()
    const EmptyListLabel = intl.formatMessage({ id: 'ticket.EmptyList.header' })
    const EmptyListManualBodyDescription = intl.formatMessage({ id: 'ticket.EmptyList.manualCreateCard.body.description' })
    const ServerErrorMsg = intl.formatMessage({ id: 'ServerError' })

    const router = useRouter()
    const { link } = useOrganization()
    const { filters, sorters } = parseQuery(router.query)
    const { filtersToWhere, sortersToSortBy } = useQueryMappers(filterMetas, sortableProperties)
    const sortBy = sortersToSortBy(sorters, TICKETS_DEFAULT_SORT_BY) as SortTicketsBy[]
    const searchTicketsQuery = useMemo(() => ({ ...baseTicketsQuery, ...filtersToWhere(filters) }),
        [baseTicketsQuery, filters, filtersToWhere])
    const searchTicketsWithoutStatusQuery = useMemo(() => ({
        ...baseTicketsQuery,
        ...filtersToWhere(omit(filters, 'status')),
    }),
    [baseTicketsQuery, filters, filtersToWhere])
    const { userFavoriteTickets } = useFavoriteTickets()
    if (filters.type === 'favorite') {
        const favoriteTicketsIds = userFavoriteTickets.map(favoriteTicket => favoriteTicket.ticket.id)
        searchTicketsQuery.id_in = searchTicketsQuery.id_in ? [...searchTicketsQuery.id_in, ...favoriteTicketsIds] : favoriteTicketsIds
        searchTicketsWithoutStatusQuery.id_in = searchTicketsWithoutStatusQuery.id_in ?
            [...searchTicketsWithoutStatusQuery.id_in, ...favoriteTicketsIds] :
            favoriteTicketsIds
    }

    const { useFlag } = useFeatureFlags()
    const isTicketImportFeatureEnabled = useFlag(TICKET_IMPORT)
    const [columns, ticketNormalizer, ticketValidator, ticketCreator] = useImporterFunctions()

    const canManageTickets = useMemo(() => get(link, ['role', 'canManageTickets'], false), [link])

    const TicketImportButton = useMemo(() => {
        return canManageTickets && showImport && isTicketImportFeatureEnabled && (
            <ImportWrapper
                accessCheck={isTicketImportFeatureEnabled}
                columns={columns}
                onFinish={undefined}
                rowValidator={ticketValidator}
                rowNormalizer={ticketNormalizer}
                objectCreator={ticketCreator}
                domainName='ticket'
            />
        )
    }, [canManageTickets, columns, isTicketImportFeatureEnabled, showImport, ticketCreator, ticketNormalizer, ticketValidator])

    //TODO(DOMA-7354): Remove featureflag after resolve global search problem
    const disableTicketCounters = useFlag('callcenter-disable-ticket-counters')

    if (loading || error) {
        const errorToPrint = error ? ServerErrorMsg : null
        return <LoadingOrErrorPage loading={loading} error={errorToPrint}/>
    }

    if (ticketsWithoutFiltersCount === 0) {
        return (
            <EmptyListContent
                label={EmptyListLabel}
                createRoute='/ticket/create'
                accessCheck={canManageTickets}
                importLayoutProps={isTicketImportFeatureEnabled && {
                    manualCreateEmoji: EMOJI.PHONE,
                    manualCreateDescription: EmptyListManualBodyDescription,
                    importCreateEmoji: EMOJI.LIST,
                    importWrapper: {
                        onFinish: undefined,
                        columns: columns,
                        rowNormalizer: ticketNormalizer,
                        rowValidator: ticketValidator,
                        objectCreator: ticketCreator,
                        domainName: 'ticket',
                    },
                }}
            />
        )
    }

    return (
        <>
            <Row gutter={LARGE_VERTICAL_ROW_GUTTER}>
                <Col span={24}>
                    <FiltersContainer
                        filterMetas={filterMetas}
                    />
                </Col>
                <Col span={24}>
                    {
                        !disableTicketCounters && (
                            <TicketStatusFilterContainer
                                searchTicketsQuery={searchTicketsQuery}
                                searchTicketsWithoutStatusQuery={searchTicketsWithoutStatusQuery}
                            />
                        )
                    }
                </Col>
            </Row>
            <TicketsTableContainer
                filterMetas={filterMetas}
                useTableColumns={useTableColumns}
                sortBy={sortBy}
                searchTicketsQuery={searchTicketsQuery}
                baseQueryLoading={loading}
                TicketImportButton={TicketImportButton}
            />
        </>
    )
}

export const TicketTypeFilterSwitch = ({ ticketFilterQuery }) => {
    const intl = useIntl()
    const AllTicketsMessage = intl.formatMessage({ id: 'pages.condo.ticket.filters.TicketType.all' })
    const OwnTicketsMessage = intl.formatMessage({ id: 'pages.condo.ticket.filters.TicketType.own' })
    const FavoriteTicketsMessage = intl.formatMessage({ id: 'pages.condo.ticket.filters.TicketType.favorite' })

    const { user } = useAuth()
    const { userFavoriteTicketsCount } = useFavoriteTickets()
    const router = useRouter()
    const { filters } = useMemo(() => parseQuery(router.query), [router.query])

    const isFavoriteTicketsSelected = filters.type === 'favorite'
    const isOwnTicketsSelected = !isFavoriteTicketsSelected && filters.type === 'own'
    const isAllTicketsSelected = !isFavoriteTicketsSelected && !isOwnTicketsSelected

    const [value, setValue] = useState<TicketType>()
    useEffect(() => {
        if (isFavoriteTicketsSelected) {
            setValue('favorite')
        } else if (isOwnTicketsSelected) {
            setValue('own')
        } else if (isAllTicketsSelected) {
            setValue('all')
        }
    }, [isAllTicketsSelected, isFavoriteTicketsSelected, isOwnTicketsSelected])

    const { count: allTicketsCount, refetch: refetchAllTickets } = Ticket.useCount({
        where: {
            ...ticketFilterQuery,
        },
    })
    const ownTicketsQuery = { OR: [{ executor: { id: user.id }, assignee: { id: user.id } }] }
    const { count: ownTicketsCount, refetch: refetchOwnTickets } = Ticket.useCount({
        where: {
            ...ticketFilterQuery,
            ...ownTicketsQuery,
        },
    })

    const { isRefetchTicketsFeatureEnabled, refetchInterval } = useAutoRefetchTickets()
    const refetch = useCallback(async () => {
        await refetchOwnTickets()
        await refetchAllTickets()
    }, [refetchAllTickets, refetchOwnTickets])

    useEffect(() => {
        if (isRefetchTicketsFeatureEnabled) {
            const handler = setInterval(async () => {
                await refetch()
            }, refetchInterval)
            return () => {
                clearInterval(handler)
            }
        }
    }, [isRefetchTicketsFeatureEnabled, refetchInterval])

    const { logEvent } = useTracking()

    const handleRadioChange = useCallback(async (event) => {
        const value = event.target.value

        setValue(value)
        logEvent({ eventName: 'TicketTypeFilterTabChange', denyDuplicates: true, eventProperties: { tab: value } })

        let newFilters
        if (value === 'all') {
            newFilters = omit(filters, ['type'])
        } else if (value === 'own') {
            newFilters = {
                ...omit(filters, ['type']),
                type: 'own',
            }
        } else if (value === 'favorite') {
            newFilters = {
                ...omit(filters, ['type']),
                type: 'favorite',
            }
        }
        const newParameters = getFiltersQueryData(newFilters)
        await updateQuery(router, { newParameters }, { routerAction: 'replace' })
    }, [filters, logEvent, router])

    return (
        <RadioGroup optionType='button' value={value} onChange={handleRadioChange}>
            <Radio
                key='all'
                value='all'
                label={
                    <>
                        {AllTicketsMessage}
                        {isNumber(allTicketsCount) && <sup>{allTicketsCount}</sup>}
                    </>
                }
            />
            <Radio
                key='own'
                value='own'
                label={
                    <>
                        {OwnTicketsMessage}
                        {isNumber(ownTicketsCount) && <sup>{ownTicketsCount}</sup>}
                    </>
                }
            />
            <Radio
                key='favorite'
                value='favorite'
                label={
                    <>
                        {FavoriteTicketsMessage}
                        {isNumber(userFavoriteTicketsCount) && <sup>{userFavoriteTicketsCount}</sup>}
                    </>
                }
            />
        </RadioGroup>
    )
}

const TicketsPage: ITicketIndexPage = () => {
    const intl = useIntl()
    const PageTitleMessage = intl.formatMessage({ id: 'pages.condo.ticket.index.PageTitle' })
    const CallRecordsLogMessage = intl.formatMessage({ id: 'callRecord.index.title' })

    const { ticketFilterQuery, ticketFilterQueryLoading } = useTicketVisibility()

    const userOrganization = useOrganization()
    const userOrganizationId = get(userOrganization, ['organization', 'id'])
    const employeeId = get(userOrganization, 'link.id')

    const filterMetas = useTicketTableFilters()

    const { GlobalHints } = useGlobalHints()
    const { breakpoints } = useLayoutContext()
    usePreviousQueryParams({ trackedParamNames: ['sort', 'filters'], employeeId })

    const {
        count: ticketsWithoutFiltersCount,
        loading: ticketsWithoutFiltersCountLoading,
        error,
    } = Ticket.useCount({ where: ticketFilterQuery })

    const {
        count: callRecordsCount,
    } = CallRecordFragment.useCount({
        where: {
            organization: { id: userOrganizationId },
        },
    })

    return (
        <>
            <Head>
                <title>{PageTitleMessage}</title>
            </Head>
            <PageWrapper>
                {GlobalHints}
                <AutoRefetchTicketsContextProvider>
                    <FavoriteTicketsContextProvider
                        extraTicketsQuery={{ ...ticketFilterQuery, organization: { id: userOrganizationId } }}
                    >
                        <WindowTitleContextProvider title={PageTitleMessage}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: breakpoints.TABLET_LARGE ? '40px' : '24px', height: '100%' }}>
                                <Row justify='space-between' align='middle' gutter={MEDIUM_VERTICAL_ROW_GUTTER}>
                                    <Col>
                                        <PageHeader
                                            style={HEADER_STYLES}
                                            title={
                                                <Typography.Title>
                                                    {PageTitleMessage}
                                                </Typography.Title>
                                            }
                                        />
                                    </Col>
                                    <Col>
                                        <Space size={20} direction={breakpoints.TABLET_SMALL ? 'horizontal' : 'vertical'}>
                                            {
                                                callRecordsCount > 0 && (
                                                    <Link href='/callRecord'>
                                                        <Typography.Link size='large'>
                                                            <Space size={8}>
                                                                <Phone size='medium'/>
                                                                {CallRecordsLogMessage}
                                                            </Space>
                                                        </Typography.Link>
                                                    </Link>
                                                )
                                            }
                                            {
                                                !ticketsWithoutFiltersCountLoading && ticketsWithoutFiltersCount > 0 && (
                                                    <TicketTypeFilterSwitch
                                                        ticketFilterQuery={ticketFilterQuery}
                                                    />
                                                )
                                            }
                                        </Space>
                                    </Col>
                                </Row>
                                <TablePageContent>
                                    <MultipleFilterContextProvider>
                                        <TicketsPageContent
                                            filterMetas={filterMetas}
                                            useTableColumns={useTableColumns}
                                            baseTicketsQuery={ticketFilterQuery}
                                            loading={ticketFilterQueryLoading || ticketsWithoutFiltersCountLoading}
                                            sortableProperties={SORTABLE_PROPERTIES}
                                            showImport
                                            ticketsWithoutFiltersCount={ticketsWithoutFiltersCount}
                                            error={error}
                                        />
                                    </MultipleFilterContextProvider>
                                </TablePageContent>
                            </div>
                        </WindowTitleContextProvider>
                    </FavoriteTicketsContextProvider>
                </AutoRefetchTicketsContextProvider>
            </PageWrapper>
        </>
    )
}

TicketsPage.requiredAccess = TicketReadPermissionRequired
export default TicketsPage