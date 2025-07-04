import { ExportTicketAnalyticsToExcelTranslates, TicketGroupedCounter, TicketLabel } from '@app/condo/schema'
import { css } from '@emotion/react'
import { Col, Divider, Form, notification, Radio, Row, Select, TableColumnsType, Tabs, Typography } from 'antd'
import dayjs, { Dayjs } from 'dayjs'
import quarterOfYear from 'dayjs/plugin/quarterOfYear'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import sum from 'lodash/sum'
import Head from 'next/head'
import { useRouter } from 'next/router'
import qs from 'qs'
import React, { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useDeepCompareEffect } from '@open-condo/codegen/utils/useDeepCompareEffect'
import { useApolloClient, useLazyQuery } from '@open-condo/next/apollo'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { ActionBar, Button } from '@open-condo/ui'

import TicketChart, { TicketSelectTypes, ViewModeTypes } from '@condo/domains/analytics/components/TicketChart'
import TicketChartView from '@condo/domains/analytics/components/TicketChartView'
import TicketListView from '@condo/domains/analytics/components/TicketListView'
import { EXPORT_TICKET_ANALYTICS_TO_EXCEL, TICKET_ANALYTICS_REPORT_QUERY } from '@condo/domains/analytics/gql'
import {
    filterToQuery,
    getAggregatedData,
    GroupTicketsByTypes,
    specificationTypes,
    ticketAnalyticsPageFilters,
    isEmptyAnalyticsData,
} from '@condo/domains/analytics/utils/helpers'
import { MAX_FILTERED_ELEMENTS, MAX_TAG_TEXT_LENGTH } from '@condo/domains/analytics/utils/helpers'
import {
    PageContent,
    PageHeader,
    PageWrapper,
    useLayoutContext,
} from '@condo/domains/common/components/containers/BaseLayout'
import { GraphQlSearchInput } from '@condo/domains/common/components/GraphQlSearchInput'
import { BarChartIcon, LinearChartIcon, PieChartIcon } from '@condo/domains/common/components/icons/ChartIcons'
import DateRangePicker from '@condo/domains/common/components/Pickers/DateRangePicker'
import RadioGroupWithIcon from '@condo/domains/common/components/RadioGroupWithIcon'
import { Tooltip } from '@condo/domains/common/components/Tooltip'
import { fontSizes } from '@condo/domains/common/constants/style'
import { PageComponentType } from '@condo/domains/common/types'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import {
    DATE_DISPLAY_FORMAT,
    TICKET_REPORT_DAY_GROUP_STEPS,
    TICKET_REPORT_TABLE_MAIN_GROUP,
} from '@condo/domains/ticket/constants/common'
import { useTicketWarningModal } from '@condo/domains/ticket/hooks/useTicketWarningModal'
import { ClassifiersQueryRemote, TicketClassifierTypes } from '@condo/domains/ticket/utils/clientSchema/classifierSearch'
import {
    searchEmployeeUser,
    searchOrganizationProperty,
} from '@condo/domains/ticket/utils/clientSchema/search'


dayjs.extend(quarterOfYear)


interface ITicketAnalyticsPageFilterProps {
    groupTicketsBy: GroupTicketsByTypes
    viewMode: ViewModeTypes
    onChange?: ({ range, specification, addressList }: ticketAnalyticsPageFilters) => void
}
const FORM_ITEM_STYLE = {
    labelCol: {
        span: 24,
    },
    wrapperCol: {
        span: 24,
    },
}
const DATE_RANGE_PRESETS = {
    week: [dayjs().subtract(1, 'week'), dayjs()],
    month: [dayjs().subtract(1, 'month'), dayjs()],
    quarter: [dayjs().subtract(1, 'quarter'), dayjs()],
    year: [dayjs().subtract(1, 'year'), dayjs()],
}

const tabsCss = css`
  & .ant-tabs-tab.ant-tabs-tab-active {
    font-weight: bold;
  }
  & .ant-tabs-nav {
    margin: 0;
  }
  & .ant-tabs-nav::before {
    border-bottom: unset;
  }
`

interface ITicketTypeSelect {
    ticketType: TicketSelectTypes
    setTicketType: Dispatch<SetStateAction<TicketSelectTypes>>
    loading: boolean
}

const TicketTypeSelect: React.FC<ITicketTypeSelect> = (props) => {
    const { ticketType, setTicketType, loading } = props
    const intl = useIntl()

    const TicketTypeAll = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.ticketType.AllTypes' })
    const TicketTypeDefault = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.ticketType.Default' })
    const TicketTypePayable = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.ticketType.Payable' })
    const TicketTypeEmergency = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.ticketType.Emergency' })

    return (
        <Select
            value={ticketType}
            onChange={(e) => setTicketType(e)}
            disabled={loading}
        >
            <Select.Option value='all'>{TicketTypeAll}</Select.Option>
            <Select.Option value='default'>{TicketTypeDefault}</Select.Option>
            <Select.Option value='payable'>{TicketTypePayable}</Select.Option>
            <Select.Option value='emergency'>{TicketTypeEmergency}</Select.Option>
        </Select>
    )
}

const TicketAnalyticsPageFilter: React.FC<ITicketAnalyticsPageFilterProps> = ({ groupTicketsBy, viewMode, onChange }) => {
    const router = useRouter()
    const intl = useIntl()
    const PeriodTitle = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.Filter.PeriodTitle' })
    const SpecificationTitle = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.Filter.SpecificationTitle' })
    const SpecificationDays = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.Filter.Specification.Days' })
    const SpecificationWeeks = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.Filter.Specification.Weeks' })
    const AllAddressesPlaceholder = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.Filter.AllAddressesPlaceholder' })
    const AllClassifiersPlaceholder = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.Filter.AllClassifiersPlaceholder' })
    const AllExecutorsPlaceholder = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.Filter.AllExecutorsPlaceholder' })
    const AllResponsiblePlaceholder = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.Filter.AllResponsiblePlaceholder' })
    const AddressTitle = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.Filter.AddressTitle' })
    const ClassifierTitle = intl.formatMessage({ id: 'Classifier' })
    const ExecutorTitle = intl.formatMessage({ id: 'field.Executor' })
    const ResponsibleTitle = intl.formatMessage({ id: 'field.Responsible' })
    const ApplyButtonTitle = intl.formatMessage({ id: 'Show' })
    const startDateMessage = intl.formatMessage({ id: 'pages.condo.meter.StartDate' })
    const endDateMessage = intl.formatMessage({ id: 'pages.condo.meter.EndDate' })

    const userOrganization = useOrganization()
    const userOrganizationId = get(userOrganization, ['organization', 'id'])
    const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([dayjs().subtract(1, 'week'), dayjs()])
    const [dateRangePreset, setDateRangePreset] = useState<null | string>(null)
    const [addressList, setAddressList] = useState([])
    const [classifierList, setClassifierList] = useState<string []>([])
    const [executorList, setExecutorList] = useState<string []>([])
    const [responsibleList, setResponsibleList] = useState<string []>([])
    const addressListRef = useRef([])
    const classifierListRef = useRef([])
    const executorListRef = useRef([])
    const responsibleListRef = useRef([])
    const [specification, setSpecification] = useState<specificationTypes>(TICKET_REPORT_DAY_GROUP_STEPS[0] as specificationTypes)
    const { breakpoints } = useLayoutContext()

    const updateUrlFilters = useCallback(() => {
        const [startDate, endDate] = dateRange
        router.push(`${router.route}?` + qs.stringify({
            createdAt_lte: startDate.format(DATE_DISPLAY_FORMAT),
            createdAt_gte: endDate.format(DATE_DISPLAY_FORMAT),
            specification,
            addressList: JSON.stringify(addressListRef.current),
            viewMode,
            groupTicketsBy,
            classifierList: JSON.stringify(classifierListRef.current),
            executorList: JSON.stringify(executorListRef.current),
            responsibleList: JSON.stringify(responsibleListRef.current),
        }), undefined, { shallow: true })
    }, [dateRange, specification, addressList, responsibleList, responsibleList, classifierList, viewMode, groupTicketsBy])

    useEffect(() => {
        // TODO(DOMA-5907): Clean this mess with and fix deps array. Also remove a type cast
        const queryParams = router.query as Record<string, string>
        const addressList = JSON.parse(get(queryParams, 'addressList', '[]'))
        const classifierList = JSON.parse(get(queryParams, 'classifierList', '[]'))
        const executorList = JSON.parse(get(queryParams, 'executorList', '[]'))
        const responsibleList = JSON.parse(get(queryParams, 'responsibleList', '[]'))
        const startDate = get(queryParams, 'createdAt_lte', dayjs().subtract(1, 'week').format(DATE_DISPLAY_FORMAT))
        const endDate = get(queryParams, 'createdAt_gte', dayjs().format(DATE_DISPLAY_FORMAT))
        const range = [dayjs(startDate, DATE_DISPLAY_FORMAT), dayjs(endDate, DATE_DISPLAY_FORMAT)] as [Dayjs, Dayjs]
        const specificationUrl = get(queryParams, 'specification')
        if (startDate && endDate && specificationUrl && addressList) {
            addressListRef.current = addressList
            setAddressList(addressList.length ? addressList.map(e => e.value) : [])
            setClassifierList(classifierList.length ? classifierList.map(e => e.value) : [])
            setExecutorList(executorList.length ? executorList.map(e => e.value) : [])
            setResponsibleList(responsibleList.length ? responsibleList.map(e => e.value) : [])
            setDateRange(range)
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            setSpecification(specificationUrl)
        }
        isEmpty(queryParams) && updateUrlFilters()
        onChange({ range, specification, addressList, classifierList, executorList, responsibleList })
    }, [])

    useEffect(() => {
        dateRangePreset !== null && setDateRange(DATE_RANGE_PRESETS[dateRangePreset])
    }, [dateRangePreset])

    useEffect(() => {
        updateUrlFilters()
    }, [viewMode, groupTicketsBy])

    useEffect(() => {
        if (dateRange[1].diff(dateRange[0], 'quarter') > 0) {
            setSpecification('week')
        }
    }, [dateRange])

    const applyFilters = useCallback(() => {
        updateUrlFilters()
        onChange({
            range: dateRange,
            specification,
            addressList: addressListRef.current,
            classifierList: classifierListRef.current,
            executorList: executorListRef.current,
            responsibleList: responsibleListRef.current,
        })
    }, [dateRange, specification, addressList, classifierList, executorList, responsibleList, viewMode, groupTicketsBy])

    const onAddressChange = useCallback((labelsList, searchObjectsList) => {
        setAddressList(labelsList as string[])
        addressListRef.current = [...searchObjectsList.map(({ key: id, title: value }) => ({ id, value }))]
    }, [addressList])

    const classifiersLoader = new ClassifiersQueryRemote(useApolloClient())

    const searchClassifiers = (_, input) =>
        classifiersLoader.search(input, TicketClassifierTypes.category, { first: undefined })
            .then(result=>result.map((classifier)=> ({ text: classifier.name, value: classifier.id })))

    const onClassifierChange = useCallback((idList, searchObjectsList) => {
        setClassifierList(idList)
        classifierListRef.current = [...searchObjectsList.map(({ key: id, title: value }) => ({ id, value }))]
    }, [classifierList])

    const onExecutorChange = useCallback((idList, searchObjectsList) => {
        setExecutorList(idList)
        executorListRef.current = [...searchObjectsList.map(({ key: id, title: value }) => ({ id, value }))]
    }, [executorList])

    const onAssigneeChange = useCallback((idList, searchObjectsList) => {
        setResponsibleList(idList)
        responsibleListRef.current = [...searchObjectsList.map(({ key: id, title: value }) => ({ id, value }))]
    }, [responsibleList])

    const onSpecificationChange = useCallback((e) => setSpecification(e), [])
    const onDateRangeChange = useCallback((range) => setDateRange(range), [])

    return (
        <Form>
            <Row gutter={[0, 40]}>
                <Col xs={24} sm={12} lg={6}>
                    <Form.Item label={PeriodTitle} {...FORM_ITEM_STYLE}>
                        <DateRangePicker
                            value={dateRange}
                            onChange={onDateRangeChange}
                            placeholder={[startDateMessage, endDateMessage]}
                        />
                    </Form.Item>
                </Col>
                <Col xs={24} sm={12} lg={4} offset={!breakpoints.TABLET_LARGE ? 0 : 1}>
                    <Form.Item label={SpecificationTitle} {...FORM_ITEM_STYLE}>
                        <Select value={specification} onChange={onSpecificationChange}>
                            <Select.Option disabled={dateRange[1].diff(dateRange[0], 'quarter') > 0} value='day'>
                                {SpecificationDays}
                            </Select.Option>
                            <Select.Option value='week'>{SpecificationWeeks}</Select.Option>
                        </Select>
                    </Form.Item>
                </Col>
                <Col xs={24} lg={12} offset={!breakpoints.TABLET_LARGE ? 0 : 1}>
                    <Form.Item label={AddressTitle} {...FORM_ITEM_STYLE}>
                        <GraphQlSearchInput
                            allowClear
                            search={searchOrganizationProperty(userOrganizationId)}
                            mode='multiple'
                            infinityScroll
                            value={addressList}
                            onChange={onAddressChange}
                            maxTagCount='responsive'
                            maxTagTextLength={MAX_TAG_TEXT_LENGTH}
                            placeholder={AllAddressesPlaceholder}
                        />
                    </Form.Item>
                </Col>
                { groupTicketsBy === 'categoryClassifier' && (
                    <Col span={24}>
                        <Form.Item label={ClassifierTitle} {...FORM_ITEM_STYLE}>
                            <GraphQlSearchInput
                                allowClear
                                search={searchClassifiers}
                                mode='multiple'
                                value={classifierList}
                                maxTagCount='responsive'
                                onChange={onClassifierChange}
                                placeholder={AllClassifiersPlaceholder}
                            />
                        </Form.Item>
                    </Col>
                )}
                { groupTicketsBy === 'executor' && (
                    <Col span={24}>
                        <Form.Item label={ExecutorTitle} {...FORM_ITEM_STYLE}>
                            <GraphQlSearchInput
                                allowClear
                                search={searchEmployeeUser(userOrganizationId, ({ role }) => (
                                    get(role, 'canBeAssignedAsExecutor', false)
                                ))}
                                mode='multiple'
                                value={executorList}
                                onChange={onExecutorChange}
                                maxTagCount='responsive'
                                placeholder={AllExecutorsPlaceholder}
                            />
                        </Form.Item>
                    </Col>
                )}
                { groupTicketsBy === 'assignee' && (
                    <Col span={24}>
                        <Form.Item label={ResponsibleTitle} {...FORM_ITEM_STYLE}>
                            <GraphQlSearchInput
                                allowClear
                                search={searchEmployeeUser(userOrganizationId, ({ role }) => (
                                    get(role, 'canBeAssignedAsResponsible', false)
                                ))}
                                mode='multiple'
                                value={responsibleList}
                                onChange={onAssigneeChange}
                                maxTagCount='responsive'
                                placeholder={AllResponsiblePlaceholder}
                            />
                        </Form.Item>
                    </Col>
                )}
                <Col span={24}>
                    <Button onClick={applyFilters} type='primary'>{ApplyButtonTitle}</Button>
                </Col>
            </Row>
        </Form>
    )
}

const TicketAnalyticsPage: PageComponentType = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.PageTitle' })
    const HeaderButtonTitle = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.HeaderButtonTitle' })
    const ViewModeTitle = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.ViewModeTitle' })
    const StatusFilterLabel = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.groupByFilter.Status' })
    const PropertyFilterLabel = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.groupByFilter.Property' })
    const CategoryFilterLabel = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.groupByFilter.Category' })
    const UserFilterLabel = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.groupByFilter.User' })
    const ResponsibleFilterLabel = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.groupByFilter.Responsible' })
    const AllAddresses = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.AllAddresses' })
    const ManyAddresses = intl.formatMessage({ id:'pages.condo.analytics.TicketAnalyticsPage.ManyAddresses' })
    const AllAddressTitle = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.tableColumns.AllAddresses' })
    const SingleAddress = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.SingleAddress' })
    const AllCategories = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.AllCategories' })
    const AllCategoryClassifiersTitle = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.tableColumns.AllClassifiers' })
    const AllExecutorsTitle = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.tableColumns.AllExecutors' })
    const AllAssigneesTitle = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.tableColumns.AllAssignees' })
    const EmptyCategoryClassifierTitle = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.NullReplaces.CategoryClassifier' })
    const EmptyExecutorTitle = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.NullReplaces.Executor' })
    const EmptyAssigneeTitle = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.NullReplaces.Assignee' })

    const TableTitle = intl.formatMessage({ id: 'Table' })
    const NotImplementedYetMessage = intl.formatMessage({ id: 'NotImplementedYet' })
    const PrintTitle = intl.formatMessage({ id: 'Print' })
    const ExcelTitle = intl.formatMessage({ id: 'Excel' })

    const router = useRouter()
    const userOrganization = useOrganization()
    const userOrganizationId = get(userOrganization, ['organization', 'id'])
    const { breakpoints } = useLayoutContext()
    const filtersRef = useRef<null | ticketAnalyticsPageFilters>(null)
    const mapperInstanceRef = useRef(null)
    const ticketLabelsRef = useRef<TicketLabel[]>([])
    const [groupTicketsBy, setGroupTicketsBy] = useState<GroupTicketsByTypes>('status')
    const [viewMode, setViewMode] = useState<ViewModeTypes>('line')
    const [analyticsData, setAnalyticsData] = useState<null | TicketGroupedCounter[]>(null)
    const [excelDownloadLink, setExcelDownloadLink] = useState<null | string>(null)
    const [ticketType, setTicketType] = useState<TicketSelectTypes>('all')
    const [dateFrom, dateTo] = filtersRef.current !== null ? filtersRef.current.range : []
    const selectedPeriod = filtersRef.current !== null ? filtersRef.current.range.map(e => e.format(DATE_DISPLAY_FORMAT)).join(' - ') : ''
    const selectedAddresses = filtersRef.current !== null ? filtersRef.current.addressList : []
    const ticketTypeRef = useRef<TicketSelectTypes>('all')

    const { TicketWarningModal, setIsVisible } = useTicketWarningModal(groupTicketsBy)
    const nullReplaces = {
        categoryClassifier: EmptyCategoryClassifierTitle,
        executor: EmptyExecutorTitle,
        assignee: EmptyAssigneeTitle,
    }

    const [loadTicketAnalytics, { loading }] = useLazyQuery(TICKET_ANALYTICS_REPORT_QUERY, {
        onError: error => {
            console.log(error)
            notification.error(error)
        },
        fetchPolicy: 'network-only',
        onCompleted: response => {
            const { result: { groups, ticketLabels } } = response
            ticketLabelsRef.current = ticketLabels
            setAnalyticsData(groups)
        },
    })
    const [exportTicketAnalyticsToExcel, { loading: isXSLXLoading }] = useLazyQuery(EXPORT_TICKET_ANALYTICS_TO_EXCEL, {
        onError: error => {
            console.log(error)
            notification.error(error)
        },
        fetchPolicy: 'network-only',
        onCompleted: response => {
            const { result: { link } } = response
            setExcelDownloadLink(link)
        },
    })

    const getAnalyticsData = useCallback(() => {
        if (filtersRef.current !== null) {
            mapperInstanceRef.current = new TicketChart({
                line: {
                    chart: (viewMode, ticketGroupedCounter) => {
                        const { groupBy } = filterToQuery(
                            { filter: filtersRef.current, viewMode, ticketType, mainGroup: groupTicketsBy }
                        )
                        const data = getAggregatedData(ticketGroupedCounter, groupBy)
                        const axisLabels = Array.from(new Set(Object.values(data).flatMap(e => Object.keys(e))))
                        const legend = Object.keys(data)
                        const series = []
                        Object.entries(data).forEach(([groupBy, dataObj]) => {
                            series.push({
                                name: groupBy,
                                type: viewMode,
                                symbol: 'none',
                                stack: groupBy,
                                data: Object.values(dataObj),
                                emphasis: {
                                    focus: 'none',
                                    blurScope: 'none',
                                },
                            })
                        })
                        const axisData = { yAxis: { type: 'value', data: null }, xAxis: { type: 'category', data: axisLabels } }
                        const tooltip = { trigger: 'axis', axisPointer: { type: 'line' } }
                        const result = { series, legend, axisData, tooltip }
                        if (groupBy[0] === 'status') {
                            result['color'] = ticketLabelsRef.current.map(({ color }) => color)
                        }
                        return result
                    },
                    table: (viewMode, ticketGroupedCounter, restOptions) => {
                        const { groupBy } = filterToQuery(
                            { filter: filtersRef.current, viewMode, ticketType, mainGroup: groupTicketsBy }
                        )
                        const data = getAggregatedData(ticketGroupedCounter, groupBy)
                        const dataSource = []
                        const { translations, filters } = restOptions
                        const tableColumns: TableColumnsType = [
                            { title: translations['address'], dataIndex: 'address', key: 'address', sorter: (a, b) => a['address'] - b['address'] },
                            {
                                title: translations['date'],
                                dataIndex: 'date',
                                key: 'date',
                                defaultSortOrder: 'descend',
                                sorter: (a, b) => dayjs(a['date'], DATE_DISPLAY_FORMAT).unix() - dayjs(b['date'], DATE_DISPLAY_FORMAT).unix(),
                            },
                            ...Object.entries(data).map(([key]) => ({ title: key, dataIndex: key, key, sorter: (a, b) =>a[key] - b[key] })),
                        ]
                        const uniqueDates = Array.from(new Set(Object.values(data).flatMap(e => Object.keys(e))))
                        uniqueDates.forEach((date, key) => {
                            const restTableColumns = {}
                            Object.keys(data).forEach(ticketType => (restTableColumns[ticketType] = data[ticketType][date]))
                            let address = translations['allAddresses']
                            const addressList = get(filters, 'address')
                            if (addressList && addressList.length) {
                                address = addressList.join(', ')
                            }
                            dataSource.push({ key, address, date, ...restTableColumns })
                        })
                        return { dataSource, tableColumns }
                    },
                },
                bar: {
                    chart: (viewMode, ticketGroupedCounter) => {
                        const { groupBy } = filterToQuery(
                            { filter: filtersRef.current, viewMode, ticketType, mainGroup: groupTicketsBy }
                        )
                        const data = getAggregatedData(ticketGroupedCounter, groupBy, true)
                        const series = []
                        const axisLabels = Object.keys(data.summary)
                            .sort((firstLabel, secondLabel) => data.summary[firstLabel] - data.summary[secondLabel])
                        const legend = Object.keys(data)
                        Object.entries(data).forEach(([name, dataObj]) => {
                            const seriesData = []
                            axisLabels.forEach(axisLabel => {
                                seriesData.push(dataObj[axisLabel])
                            })
                            series.push({
                                name,
                                type: viewMode,
                                symbol: 'none',
                                stack: 'total',
                                sampling: 'sum',
                                large: true,
                                largeThreshold: 200,
                                data: seriesData,
                                emphasis: {
                                    focus: 'self',
                                    blurScope: 'self',
                                },
                            })
                        })
                        const axisData = { yAxis: { type: 'category', data: axisLabels }, xAxis: { type: 'value', data: null } }
                        const tooltip = { trigger: 'item', axisPointer: { type: 'line' }, borderColor: '#fff' }
                        const result = { series, legend, axisData, tooltip }
                        if (groupBy[0] === 'status') {
                            result['color'] = ticketLabelsRef.current.map(({ color }) => color)
                        }
                        return result
                    },
                    table: (viewMode, ticketGroupedCounter, restOptions) => {
                        const { groupBy } = filterToQuery(
                            { filter: filtersRef.current, viewMode, ticketType, mainGroup: groupTicketsBy }
                        )
                        const data = getAggregatedData(ticketGroupedCounter, groupTicketsBy === 'status' ? groupBy.reverse() : groupBy)
                        const { translations, filters } = restOptions
                        const dataSource = []
                        const tableColumns: TableColumnsType = [
                            { title: translations['address'], dataIndex: 'address', key: 'address', sorter: (a, b) => a['address'] - b['address'] },
                            ...Object.entries(data).map(([key]) => ({ title: key, dataIndex: key, key, sorter: (a, b) => a[key] - b[key] })),
                        ]

                        if (TICKET_REPORT_TABLE_MAIN_GROUP.includes(groupBy[1])) {
                            tableColumns.unshift({
                                title: translations[groupBy[1]],
                                dataIndex: groupBy[1],
                                key: groupBy[1],
                                sorter: (a, b) => a[groupBy[1]] - b[groupBy[1]],
                            })
                        }

                        const restTableColumns = {}
                        const addressList = get(filters, 'address', [])
                        const aggregateSummary = [addressList, get(filters, groupBy[1], [])]
                            .every(filterList => filterList.length === 0)
                        if (aggregateSummary) {
                            Object.entries(data).forEach((rowEntry) => {
                                const [ticketType, dataObj] = rowEntry
                                const counts = Object.values(dataObj) as number[]
                                restTableColumns[ticketType] = sum(counts)
                            })
                            dataSource.push({
                                key: 0,
                                address: translations['allAddresses'],
                                categoryClassifier: translations['allCategoryClassifiers'],
                                executor: translations['allExecutors'],
                                assignee: translations['allAssignees'],
                                ...restTableColumns,
                            })
                        } else {
                            const mainAggregation = TICKET_REPORT_TABLE_MAIN_GROUP.includes(groupBy[1]) ? get(filters, groupBy[1], []) : null
                            // TODO(sitozzz): find clean solution for aggregation by 2 id_in fields
                            if (mainAggregation === null) {
                                addressList.forEach((address, key) => {
                                    const tableRow = { key, address }
                                    Object.entries(data).forEach(rowEntry => {
                                        const [ticketType, dataObj] = rowEntry
                                        const counts = Object.entries(dataObj)
                                            .filter(obj => obj[0] === address).map(e => e[1]) as number[]
                                        tableRow[ticketType] = sum(counts)
                                    })
                                    dataSource.push(tableRow)
                                })
                            } else {
                                mainAggregation.forEach((aggregateField, key) => {
                                    const tableRow = { key, [groupBy[1]]: aggregateField }
                                    tableRow['address'] = addressList.length
                                        ? addressList.join(', ')
                                        : translations['allAddresses']
                                    Object.entries(data).forEach(rowEntry => {
                                        const [ticketType, dataObj] = rowEntry
                                        const counts = Object.entries(dataObj)
                                            .filter(obj => obj[0] === aggregateField).map(e => e[1]) as number[]
                                        tableRow[ticketType] = sum(counts)
                                    })
                                    dataSource.push(tableRow)
                                })
                            }
                        }
                        return { dataSource, tableColumns }
                    },
                },
                pie: {
                    chart: (viewMode, ticketGroupedCounter) => {
                        const { groupBy } = filterToQuery(
                            { filter: filtersRef.current, viewMode, ticketType, mainGroup: groupTicketsBy }
                        )
                        const data = getAggregatedData(ticketGroupedCounter, groupBy)
                        const series = []

                        const legend = [...new Set(Object.values(data).flatMap(e => Object.keys(e)))]
                        Object.entries(data).forEach(([label, groupObject]) => {
                            const chartData = Object.entries(groupObject)
                                .map(([name, value]) => ({ name, value }))
                            if (chartData.map(({ value }) => value).some(value => value > 0)) {
                                series.push({
                                    name: label,
                                    data: chartData,
                                    selectedMode: false,
                                    type: viewMode,
                                    radius: [60, 120],
                                    center: ['25%', '50%'],
                                    symbol: 'none',
                                    emphasis: {
                                        focus: 'self',
                                        blurScope: 'self',
                                    },
                                    labelLine: { show: false },
                                    label: {
                                        show: true,
                                        fontSize: fontSizes.content,
                                        overflow: 'none',
                                        formatter: [
                                            '{value|{b}} {percent|{d} %}',
                                        ].join('\n'),
                                        rich: {
                                            value: {
                                                fontSize: fontSizes.content,
                                                align: 'left',
                                                width: 100,
                                            },
                                            percent: {
                                                align: 'left',
                                                fontWeight: 700,
                                                fontSize: fontSizes.content,
                                                width: 40,
                                            },
                                        },
                                    },
                                    labelLayout: (chart) =>  {
                                        const { dataIndex, seriesIndex } = chart
                                        const elementYOffset = 25 * dataIndex
                                        const yOffset = 75 + 250 * Math.floor(seriesIndex / 2) + 10 + elementYOffset
                                        return {
                                            x: 340,
                                            y: yOffset,
                                            align: 'left',
                                            verticalAlign: 'top',
                                        }
                                    },
                                })
                            }
                        })
                        return { series, legend, color: ticketLabelsRef.current.map(({ color }) => color) }
                    },
                    table: (viewMode, ticketGroupedCounter, restOptions) => {
                        const { groupBy } = filterToQuery(
                            { filter: filtersRef.current, viewMode, ticketType, mainGroup: groupTicketsBy }
                        )
                        const data = getAggregatedData(ticketGroupedCounter, groupBy.reverse())
                        const { translations, filters } = restOptions
                        const dataSource = []
                        const tableColumns: TableColumnsType = [
                            { title: translations['address'], dataIndex: 'address', key: 'address', sorter: (a, b) => a['address'] - b['address'] },
                            ...Object.entries(data).map(([key]) => ({ title: key, dataIndex: key, key, sorter: (a, b) => a[key] - b[key] })),
                        ]

                        if (TICKET_REPORT_TABLE_MAIN_GROUP.includes(groupBy[1])) {
                            tableColumns.unshift({
                                title: translations[groupBy[1]],
                                dataIndex: groupBy[1],
                                key: groupBy[1],
                                sorter: (a, b) => a[groupBy[1]] - b[groupBy[1]],
                            })
                        }

                        const restTableColumns = {}
                        const addressList = get(filters, 'address', [])
                        const aggregateSummary = [addressList, get(filters, groupBy[1], [])]
                            .every(filterList => filterList.length === 0)
                        if (aggregateSummary) {
                            const totalCount = Object.values(data)
                                .reduce((prev, curr) => prev + sum(Object.values(curr)), 0)

                            Object.entries(data).forEach((rowEntry) => {
                                const [ticketType, dataObj] = rowEntry
                                const counts = Object.values(dataObj) as number[]
                                restTableColumns[ticketType] = totalCount > 0
                                    ? ((sum(counts) / totalCount) * 100).toFixed(2) + ' %'
                                    : totalCount
                            })
                            dataSource.push({
                                key: 0,
                                address: translations['allAddresses'],
                                categoryClassifier: translations['allCategoryClassifiers'],
                                executor: translations['allExecutors'],
                                assignee: translations['allAssignees'],
                                ...restTableColumns,
                            })
                        } else {
                            const totalCounts = {}
                            Object.values(data).forEach((dataObj) => {
                                Object.entries(dataObj).forEach(([aggregationField, count]) => {
                                    if (get(totalCounts, aggregationField, false)) {
                                        totalCounts[aggregationField] += count
                                    } else {
                                        totalCounts[aggregationField] = count
                                    }
                                })
                            })
                            const mainAggregation = TICKET_REPORT_TABLE_MAIN_GROUP.includes(groupBy[1]) ? get(filters, groupBy[1], []) : null
                            // TODO(sitozzz): find clean solution for aggregation by 2 id_in fields
                            if (mainAggregation === null) {
                                addressList.forEach((address, key) => {
                                    const tableRow = { key, address }
                                    Object.entries(data).forEach(rowEntry => {
                                        const [ticketType, dataObj] = rowEntry
                                        const counts = Object.entries(dataObj)
                                            .filter(obj => obj[0] === address).map(e => e[1]) as number[]
                                        const totalPropertyCount = sum(counts)
                                        tableRow[ticketType] = totalCounts[address] > 0
                                            ? (totalPropertyCount / totalCounts[address] * 100).toFixed(2) + ' %'
                                            : totalCounts[address]
                                    })
                                    dataSource.push(tableRow)
                                })
                            } else {
                                mainAggregation.forEach((aggregateField, key) => {
                                    const tableRow = { key, [groupBy[1]]: aggregateField }
                                    tableRow['address'] = addressList.length
                                        ? addressList.join(', ')
                                        : translations['allAddresses']
                                    Object.entries(data).forEach(rowEntry => {
                                        const [ticketType, dataObj] = rowEntry
                                        const counts = Object.entries(dataObj)
                                            .filter(obj => obj[0] === aggregateField).map(e => e[1]) as number[]
                                        const totalPropertyCount = sum(counts)
                                        tableRow[ticketType] = totalCounts[aggregateField] > 0
                                            ? (totalPropertyCount / totalCounts[aggregateField] * 100).toFixed(2) + ' %'
                                            : totalCounts[aggregateField]
                                    })
                                    dataSource.push(tableRow)
                                })
                            }
                        }
                        return { dataSource, tableColumns }
                    },
                },
            })
            const { AND, groupBy } = filterToQuery(
                { filter: filtersRef.current, viewMode, ticketType: ticketTypeRef.current, mainGroup: groupTicketsBy }
            )

            const where = { organization: { id: userOrganizationId }, AND }
            loadTicketAnalytics({ variables: { data: { groupBy, where, nullReplaces } } })
        }
    }, [userOrganizationId, viewMode, groupTicketsBy])

    useDeepCompareEffect(() => {
        // TODO(DOMA-5907): Clean this mess with and fix deps array. Also remove a type cast
        const queryParams = router.query as Record<string, string>
        setGroupTicketsBy(get(queryParams, 'groupTicketsBy', 'status') as GroupTicketsByTypes)
        setViewMode(get(queryParams, 'viewMode', 'line') as ViewModeTypes)
    }, [router.query])

    useEffect(() => {
        ticketTypeRef.current = ticketType
        setAnalyticsData(null)
        getAnalyticsData()
    }, [groupTicketsBy, userOrganizationId, ticketType, viewMode])

    // Download excel file when file link was created
    useEffect(() => {
        if (excelDownloadLink !== null && !isXSLXLoading) {
            const link = document.createElement('a')
            link.href = excelDownloadLink
            link.target = '_blank'
            link.hidden = true
            document.body.appendChild(link)
            link.click()
            link.parentNode.removeChild(link)
            setExcelDownloadLink(null)
        }
    }, [excelDownloadLink, isXSLXLoading])

    const printPdf = useCallback(
        () => {
            let currentFilter
            switch (groupTicketsBy) {
                case 'property':
                    currentFilter = filtersRef.current.addressList
                    break
                case 'categoryClassifier':
                    currentFilter = filtersRef.current.classifierList
                    break
                case 'executor':
                    currentFilter = filtersRef.current.executorList
                    break
                case 'assignee':
                    currentFilter = filtersRef.current.responsibleList
                    break
                default:
                    currentFilter = null
            }

            const uniqueDataSets = Array.from(new Set(analyticsData.map(ticketCounter => ticketCounter[groupTicketsBy])))
            const isPdfAvailable = currentFilter === null
                || uniqueDataSets.length < MAX_FILTERED_ELEMENTS
                || (currentFilter.length !== 0 && currentFilter.length < MAX_FILTERED_ELEMENTS)
            if (isPdfAvailable) {
                router.push(router.route + '/pdf?' + qs.stringify({
                    dateFrom: dateFrom.toISOString(),
                    dateTo: dateTo.toISOString(),
                    groupBy: groupTicketsBy,
                    ticketType,
                    viewMode,
                    addressList: JSON.stringify(filtersRef.current.addressList),
                    executorList: JSON.stringify(filtersRef.current.executorList),
                    assigneeList: JSON.stringify(filtersRef.current.responsibleList),
                    categoryClassifierList: JSON.stringify(filtersRef.current.classifierList),
                    specification: filtersRef.current.specification,
                }))
            } else {
                setIsVisible(true)
            }
        },
        [ticketType, viewMode, dateFrom, dateTo, groupTicketsBy, userOrganizationId, analyticsData],
    )

    const downloadExcel = useCallback(
        () => {
            const { AND, groupBy } = filterToQuery({ filter: filtersRef.current, viewMode, ticketType, mainGroup: groupTicketsBy })
            const where = { organization: { id: userOrganizationId }, AND }
            const filters = filtersRef.current
            const translates: ExportTicketAnalyticsToExcelTranslates = {
                property: filters.addressList.length
                    ? filters.addressList.map(({ value }) => value).join('@')
                    : AllAddressTitle,
                categoryClassifier: filters.classifierList.length
                    ? filters.classifierList.map(({ value }) => value).join('@')
                    : AllCategoryClassifiersTitle,
                executor: filters.executorList.length
                    ? filters.executorList.map(({ value }) => value).join('@')
                    : AllExecutorsTitle,
                assignee: filters.responsibleList.length
                    ? filters.responsibleList.map(({ value }) => value).join('@')
                    : AllAssigneesTitle,
            }

            exportTicketAnalyticsToExcel({ variables: { data: { groupBy, where, translates, nullReplaces } } })
        },
        [ticketType, viewMode, dateFrom, dateTo, groupTicketsBy, userOrganizationId],
    )
    const onFilterChange: ITicketAnalyticsPageFilterProps['onChange'] = useCallback((filters) => {
        setAnalyticsData(null)
        filtersRef.current = filters
        getAnalyticsData()
    }, [viewMode, userOrganizationId, groupTicketsBy, dateFrom, dateTo])

    let addressFilterTitle = selectedAddresses.length === 0 ? AllAddresses : `${SingleAddress} «${selectedAddresses[0].value}»`
    if (selectedAddresses.length > 1) {
        addressFilterTitle = ManyAddresses
    }

    const onTabChange = useCallback((key: GroupTicketsByTypes) => {
        setGroupTicketsBy((prevState) => {
            if (prevState !== key) {
                setAnalyticsData(null)
                return key
            } else {
                return prevState
            }
        })
        if (key === 'status') {
            setViewMode('line')
        } else {
            setViewMode('bar')
        }
    }, [viewMode, groupTicketsBy])

    const isControlsDisabled = loading || isXSLXLoading || filtersRef.current === null

    return <>
        <Head>
            <title>{PageTitle}</title>
        </Head>
        <PageWrapper>
            <PageContent>
                <Row gutter={[0, 40]}>
                    <Col xs={24} sm={18}>
                        <PageHeader title={<Typography.Title>{PageTitle}</Typography.Title>} />
                    </Col>
                    <Col span={6} hidden={!breakpoints.TABLET_LARGE}>
                        <Tooltip title={NotImplementedYetMessage}>
                            <Button type='secondary'>{HeaderButtonTitle}</Button>
                        </Tooltip>
                    </Col>
                </Row>
                <Row gutter={[0, 24]} align='top' justify='space-between'>
                    <Col span={24}>
                        <Tabs
                            css={tabsCss}
                            defaultActiveKey='status'
                            activeKey={groupTicketsBy}
                            onChange={onTabChange}
                        >
                            <Tabs.TabPane key='status' tab={StatusFilterLabel} />
                            <Tabs.TabPane key='property' tab={PropertyFilterLabel} />
                            <Tabs.TabPane key='categoryClassifier' tab={CategoryFilterLabel} />
                            <Tabs.TabPane key='executor' tab={UserFilterLabel} />
                            <Tabs.TabPane key='assignee' tab={ResponsibleFilterLabel} />
                        </Tabs>
                    </Col>
                    <Col span={24}>
                        <Row justify='space-between' gutter={[0, 20]}>
                            <Col span={24}>
                                <TicketAnalyticsPageFilter
                                    onChange={onFilterChange}
                                    viewMode={viewMode}
                                    groupTicketsBy={groupTicketsBy}
                                />
                            </Col>
                            <Col span={24}>
                                <Divider/>
                            </Col>
                            <Col xs={24} lg={16}>
                                <Typography.Title level={3}>
                                    {ViewModeTitle} {selectedPeriod} {addressFilterTitle} {AllCategories}
                                </Typography.Title>
                            </Col>
                            <Col xs={12} lg={3}>
                                <RadioGroupWithIcon
                                    value={viewMode}
                                    size='small'
                                    buttonStyle='outline'
                                    onChange={(e) => setViewMode(e.target.value)}
                                >
                                    {groupTicketsBy === 'status' && (
                                        <Radio.Button value='line'>
                                            <LinearChartIcon height={32} width={24} />
                                        </Radio.Button>
                                    )}
                                    <Radio.Button value='bar'>
                                        <BarChartIcon height={32} width={24} />
                                    </Radio.Button>
                                    {groupTicketsBy !== 'status' && (
                                        <Radio.Button value='pie'>
                                            <PieChartIcon height={32} width={24} />
                                        </Radio.Button>
                                    )}
                                </RadioGroupWithIcon>
                            </Col>
                            <Col
                                xs={8}
                                hidden={breakpoints.TABLET_LARGE}
                            >
                                <TicketTypeSelect
                                    ticketType={ticketType}
                                    setTicketType={setTicketType}
                                    loading={loading}
                                />
                            </Col>
                        </Row>
                    </Col>
                    <Col span={24}>
                        {useMemo(() => (
                            <TicketChartView
                                data={analyticsData}
                                loading={loading}
                                viewMode={viewMode}
                                mainGroup={groupTicketsBy}
                                chartConfig={{
                                    animationEnabled: true,
                                    chartOptions: { renderer: 'svg', height: viewMode === 'line' ? 440 : 'auto' },
                                }}
                                mapperInstance={mapperInstanceRef.current}
                            >
                                <Col
                                    style={{ position: 'absolute', top: 0, right: 0, minWidth: '132px' }}
                                    hidden={!breakpoints.TABLET_LARGE}
                                >
                                    <TicketTypeSelect
                                        ticketType={ticketType}
                                        setTicketType={setTicketType}
                                        loading={loading}
                                    />
                                </Col>
                            </TicketChartView>
                        ), [analyticsData, loading, viewMode, ticketType, userOrganizationId, groupTicketsBy, breakpoints.TABLET_LARGE])}
                    </Col>
                    <Col span={24}>
                        <Row gutter={[0, 20]}>
                            <Col span={24}>
                                <Typography.Title level={4}>{TableTitle}</Typography.Title>
                            </Col>
                            <Col span={24}>
                                {useMemo(() => (
                                    <TicketListView
                                        data={analyticsData}
                                        loading={loading}
                                        viewMode={viewMode}
                                        filters={filtersRef.current}
                                        mapperInstance={mapperInstanceRef.current}
                                    />
                                ), [analyticsData, loading, viewMode, ticketType, userOrganizationId, groupTicketsBy])}
                            </Col>
                        </Row>
                    </Col>
                    {
                        breakpoints.TABLET_LARGE ? (
                            <ActionBar
                                actions={[
                                    <Button
                                        key='print'
                                        disabled={isControlsDisabled || isEmptyAnalyticsData(analyticsData)} onClick={printPdf}
                                        type='secondary'
                                    >
                                        {PrintTitle}
                                    </Button>,
                                    <Button
                                        key='edit'
                                        disabled={isControlsDisabled || isEmptyAnalyticsData(analyticsData)}
                                        onClick={downloadExcel}
                                        loading={isXSLXLoading}
                                        type='secondary'
                                    >
                                        {ExcelTitle}
                                    </Button>,
                                ]}
                            />
                        ) : <></>
                    }
                </Row>
                <TicketWarningModal />
            </PageContent>
        </PageWrapper>
    </>
}

TicketAnalyticsPage.requiredAccess = OrganizationRequired

export default TicketAnalyticsPage
