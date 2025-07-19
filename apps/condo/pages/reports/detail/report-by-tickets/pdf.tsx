import { TicketAnalyticsGroupBy, TicketGroupedCounter, TicketLabel } from '@app/condo/schema'
import { Col, notification, Row, TableColumnsType, Typography } from 'antd'
import dayjs from 'dayjs'
import get from 'lodash/get'
import sum from 'lodash/sum'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import React, { useEffect, useRef, useState } from 'react'

import { useLazyQuery } from '@open-condo/next/apollo'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import TicketChart, { TicketSelectTypes, ViewModeTypes } from '@condo/domains/analytics/components/TicketChart'
import TicketChartView from '@condo/domains/analytics/components/TicketChartView'
import TicketListView from '@condo/domains/analytics/components/TicketListView'
import { TICKET_ANALYTICS_REPORT_QUERY } from '@condo/domains/analytics/gql'
import { filterToQuery, getAggregatedData, GroupTicketsByTypes } from '@condo/domains/analytics/utils/helpers'
import { Loader } from '@condo/domains/common/components/Loader'
import { Logo } from '@condo/domains/common/components/Logo'
import { PageComponentType } from '@condo/domains/common/types'
import { createPdfWithPageBreaks } from '@condo/domains/common/utils/pdf'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import {
    DATE_DISPLAY_FORMAT,
    PDF_REPORT_WIDTH,
    TICKET_REPORT_TABLE_MAIN_GROUP,
} from '@condo/domains/ticket/constants/common'


const PdfView = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.PageTitle' })
    const AllAddresses = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.AllAddresses' })
    const SingleAddress = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.SingleAddress' })
    const ManyAddresses = intl.formatMessage({ id:'pages.condo.analytics.TicketAnalyticsPage.ManyAddresses' })
    const AllCategories = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.AllCategories' })
    const DefaultTickets = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.DefaultTickets' })
    const PayableTickets = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.PayableTickets' })
    const EmergencyTickets = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.EmergencyTickets' })
    const LoadingTip = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.PDF.LoadingTip' })
    const EmptyCategoryClassifierTitle = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.NullReplaces.CategoryClassifier' })
    const EmptyExecutorTitle = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.NullReplaces.Executor' })
    const EmptyAssigneeTitle = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.NullReplaces.Assignee' })

    const router = useRouter()

    const containerRef = useRef<null | HTMLDivElement>(null)
    const queryParamsRef = useRef(null)
    const groupByRef = useRef<null | TicketAnalyticsGroupBy[]>(null)
    const mapperInstanceRef = useRef(null)
    const ticketLabelsRef = useRef<TicketLabel[]>([])

    const [data, setData] = useState<null | TicketGroupedCounter[]>(null)
    // 2 different loading states by reason of it is 2 step page loading - 1st is data fetch, 2nd is wait for all charts to be rendered
    const [loading, setLoading] = useState(true)
    const [chartLoading, setChartLoading] = useState(true)
    const userOrganization = useOrganization()
    const userOrganizationId = get(userOrganization, ['organization', 'id'])

    const nullReplaces = {
        categoryClassifier: EmptyCategoryClassifierTitle,
        executor: EmptyExecutorTitle,
        assignee: EmptyAssigneeTitle,
    }

    const [loadTicketAnalyticsData] = useLazyQuery(TICKET_ANALYTICS_REPORT_QUERY, {
        onError: error => {
            console.log(error)
            notification.error({
                message: intl.formatMessage(({ id: 'errors.PdfGenerationError' })),
                description: error.message,
            })
            setLoading(false)
        },
        fetchPolicy: 'network-only',
        onCompleted: response => {
            setLoading(false)
            const { result: { groups, ticketLabels } } = response
            ticketLabelsRef.current = ticketLabels
            setData(groups)
        },
    })
    useEffect(() => {
        // TODO(DOMA-5907): Clean this mess with and fix deps array. Also remove a type cast
        const queryParams = router.query as Record<string, string>
        queryParamsRef.current = queryParams
        const dateFrom = get(queryParams, 'dateFrom', dayjs().subtract(1, 'week'))
        const dateTo = get(queryParams, 'dateTo', dayjs())
        const addressList = JSON.parse(get(queryParams, 'addressList', '[]'))
        const classifierList = JSON.parse(get(queryParams, 'categoryClassifierList', '[]'))
        const executorList = JSON.parse(get(queryParams, 'executorList', '[]'))
        const assigneeList = JSON.parse(get(queryParams, 'assigneeList', '[]'))
        const mainGroup = get(queryParams, 'groupBy', 'status') as GroupTicketsByTypes
        const specification = get(queryParams, 'specification', 'day') as 'day' | 'week' | 'month'
        const viewMode = get(queryParams, 'viewMode', 'line') as ViewModeTypes
        const ticketType = get(queryParams, 'ticketType', 'all') as TicketSelectTypes
        const { AND, groupBy } = filterToQuery({
            viewMode,
            ticketType,
            filter: {
                range: [dayjs(dateFrom), dayjs(dateTo)],
                addressList,
                specification,
                classifierList,
                executorList,
                responsibleList: assigneeList,
            },
            mainGroup,
        })
        groupByRef.current = groupBy
        const where = { organization: { id: userOrganizationId }, AND }

        loadTicketAnalyticsData({ variables: { data: { groupBy, where, nullReplaces } } })

    }, [userOrganizationId])

    useEffect(() => {
        if (mapperInstanceRef.current === null && groupByRef.current !== null) {
            const mainGroup = get(queryParamsRef.current, 'groupBy', 'status')
            mapperInstanceRef.current = new TicketChart({
                line: {
                    chart: (viewMode, ticketGroupedCounter) => {
                        const data = getAggregatedData(ticketGroupedCounter, groupByRef.current)
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
                        if (groupByRef.current[0] === 'status') {
                            result['color'] = ticketLabelsRef.current.map(({ color }) => color)
                        }
                        return result
                    },
                    table: (viewMode, ticketGroupedCounter, restOptions) => {
                        const data = getAggregatedData(ticketGroupedCounter, groupByRef.current)
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
                        const data = getAggregatedData(ticketGroupedCounter, groupByRef.current, true)
                        const series = []
                        const axisLabels = Object.keys(data.summary)
                            .sort((firstLabel, secondLabel) => data.summary[firstLabel] - data.summary[secondLabel])
                        const legend = Object.keys(data)
                        Object.entries(data).forEach(([groupBy, dataObj]) => {
                            const seriesData = []
                            axisLabels.forEach(axisLabel => {
                                seriesData.push(dataObj[axisLabel])
                            })
                            series.push({
                                name: groupBy,
                                type: viewMode,
                                symbol: 'none',
                                stack: 'total',
                                data: seriesData,
                                emphasis: {
                                    focus: 'self',
                                    blurScope: 'self',
                                },
                            })
                        })
                        const axisData = { yAxis: { type: 'category', data: axisLabels }, xAxis: { type: 'value', data: null } }
                        const tooltip = { trigger: 'item', axisPointer: { type: 'line' }, show: false }
                        const result = { series, legend, axisData, tooltip }
                        if (groupByRef.current[0] === 'status') {
                            result['color'] = ticketLabelsRef.current.map(({ color }) => color)
                        }
                        return result

                    },
                    table: (viewMode, ticketGroupedCounter, restOptions) => {
                        const groupByCopy = [...groupByRef.current]
                        const data = getAggregatedData(ticketGroupedCounter, mainGroup === 'status' ? groupByCopy.reverse() : groupByCopy)
                        const { translations, filters } = restOptions
                        const dataSource = []
                        const tableColumns: TableColumnsType = [
                            { title: translations['address'], dataIndex: 'address', key: 'address', sorter: (a, b) => a['address'] - b['address'] },
                            ...Object.entries(data).map(([key]) => ({ title: key, dataIndex: key, key, sorter: (a, b) => a[key] - b[key] })),
                        ]

                        if (TICKET_REPORT_TABLE_MAIN_GROUP.includes(groupByRef.current[1])) {
                            tableColumns.unshift({
                                title: translations[groupByRef.current[1]],
                                dataIndex: groupByRef.current[1],
                                key: groupByRef.current[1],
                                sorter: (a, b) => a[groupByRef.current[1]] - b[groupByRef.current[1]],
                            })
                        }

                        const restTableColumns = {}
                        const addressList = get(filters, 'address', [])
                        const aggregateSummary = [addressList, get(filters, groupByRef.current[1], [])]
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
                            const mainAggregation = TICKET_REPORT_TABLE_MAIN_GROUP.includes(groupByRef.current[1]) ? get(filters, groupByRef.current[1], []) : null
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
                                    const tableRow = { key, [groupByRef.current[1]]: aggregateField }
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
                        // TODO(DOMA-5907): Clean this mess with and fix deps array. Also remove a type cast
                        const queryParams = router.query as Record<string, string>
                        const dateFrom = get(queryParams, 'dateFrom', dayjs().subtract(1, 'week'))
                        const dateTo = get(queryParams, 'dateTo', dayjs())
                        const addressList = JSON.parse(get(queryParams, 'addressList', '[]'))
                        const classifierList = JSON.parse(get(queryParams, 'categoryClassifierList', '[]'))
                        const executorList = JSON.parse(get(queryParams, 'executorList', '[]'))
                        const assigneeList = JSON.parse(get(queryParams, 'assigneeList', '[]'))
                        const mainGroup = get(queryParams, 'groupBy', 'status') as GroupTicketsByTypes
                        const specification = get(queryParams, 'specification', 'day') as 'day' | 'month' | 'week'
                        const ticketType = get(queryParams, 'ticketType', 'all') as TicketSelectTypes
                        const { groupBy } = filterToQuery({
                            viewMode,
                            ticketType,
                            filter: {
                                range: [dayjs(dateFrom), dayjs(dateTo)],
                                addressList,
                                specification,
                                executorList: executorList,
                                classifierList,
                                responsibleList: assigneeList,
                            },
                            mainGroup,
                        })
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
                                    center: ['30%', '50%'],
                                    symbol: 'none',
                                    emphasis: {
                                        focus: 'self',
                                        blurScope: 'self',
                                    },
                                    labelLine: { show: false },
                                    label: {
                                        show: true,
                                        fontSize: 14,
                                        overflow: 'none',
                                        formatter: [
                                            '{value|{b}} {percent|{d} %}',
                                        ].join('\n'),
                                        rich: {
                                            value: {
                                                fontSize: 14,
                                                align: 'left',
                                                width: 100,
                                            },
                                            percent: {
                                                align: 'left',
                                                fontWeight: 700,
                                                fontSize: 14,
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
                        // TODO(DOMA-5907): Clean this mess with and fix deps array. Also remove a type cast
                        const queryParams = router.query as Record<string, string>
                        const dateFrom = get(queryParams, 'dateFrom', dayjs().subtract(1, 'week'))
                        const dateTo = get(queryParams, 'dateTo', dayjs())
                        const mainGroup = get(queryParams, 'groupBy', 'status') as GroupTicketsByTypes
                        const specification = get(queryParams, 'specification', 'day') as 'day' | 'month' | 'week'
                        const ticketType = get(queryParams, 'ticketType', 'all') as TicketSelectTypes
                        const { groupBy } = filterToQuery({
                            viewMode,
                            ticketType,
                            filter: {
                                range: [dayjs(dateFrom), dayjs(dateTo)],
                                addressList: JSON.parse(get(queryParams, 'addressList', '[]')),
                                specification,
                                classifierList: JSON.parse(get(queryParams, 'categoryClassifierList', '[]')),
                                executorList: JSON.parse(get(queryParams, 'executorList', '[]')),
                                responsibleList: JSON.parse(get(queryParams, 'assigneeList', '[]')),
                            },
                            mainGroup,
                        })
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
        }
        if (!loading && !chartLoading && data !== null) {
            createPdfWithPageBreaks({ element: containerRef.current, fileName: 'analytics_result.pdf' })
                .catch((e) => {
                    notification.error({
                        message: intl.formatMessage(({ id: 'errors.PdfGenerationError' })),
                        description: e.message,
                    })
                })
        }
    }, [loading, data, chartLoading])

    if (queryParamsRef.current === null ) {
        return null
    }
    let ticketTypeTitle = DefaultTickets
    const {
        dateFrom, dateTo, viewMode, ticketType, addressList, specification, executorList, assigneeList, categoryClassifierList,
    } = queryParamsRef.current
    ticketType === 'payable' && (ticketTypeTitle = PayableTickets)
    ticketType === 'emergency' && (ticketTypeTitle = EmergencyTickets)
    const addressListParsed = JSON.parse(addressList)
    let addressFilterTitle = addressListParsed.length ? `${SingleAddress} «${addressListParsed[0].value}»` : AllAddresses
    if (addressListParsed.length > 1) {
        addressFilterTitle = ManyAddresses
    }
    return <>
        {loading && <Loader fill spinning tip={LoadingTip} /> }
        <Row
            ref={containerRef}
            gutter={[0, 40]}
            style={{ width: PDF_REPORT_WIDTH, paddingLeft: 80, paddingRight: 120, pointerEvents: 'none' }}
        >
            <Col flex={1} style={{ visibility: loading ? 'hidden' : 'visible', position: 'relative' }}>
                <Typography.Paragraph style={{ position: 'absolute', top: 0, right: 0 }}>
                    <Logo />
                </Typography.Paragraph>
                {chartLoading &&
                    <Typography.Paragraph>
                        <Loader fill spinning tip={LoadingTip} />
                    </Typography.Paragraph>
                }
                <Typography.Title level={3}>{PageTitle}</Typography.Title>
                <Typography.Title level={4}>
                    {ticketTypeTitle} {dayjs(dateFrom).format('DD.MM.YYYY')} - {dayjs(dateTo).format('DD.MM.YYYY')} {addressFilterTitle} {AllCategories}
                </Typography.Title>
                <TicketChartView
                    data={data}
                    viewMode={viewMode}
                    onChartReady={() => setChartLoading(false)}
                    mapperInstance={mapperInstanceRef.current}
                    chartConfig={{
                        animationEnabled: false,
                        chartOptions: { renderer: 'svg', height: viewMode === 'line' ? 400 : 'auto' },
                    }}
                />
            </Col>
            <Col flex={1} >
                <TicketListView
                    mapperInstance={mapperInstanceRef.current}
                    data={data}
                    viewMode={viewMode}
                    filters={{
                        range: [dateFrom, dateTo],
                        addressList: addressListParsed,
                        specification: specification,
                        classifierList: JSON.parse(categoryClassifierList),
                        executorList: JSON.parse(executorList),
                        responsibleList: JSON.parse(assigneeList),
                    }}
                />
            </Col>
        </Row>
    </>
}

const DynamicPdfView = dynamic(() => Promise.resolve(PdfView), { ssr: false })

const AnalyticsPdfPage: PageComponentType = () => (
    <DynamicPdfView />
)

AnalyticsPdfPage.container = ({ children }) => (
    <Typography.Paragraph style={{ padding: 40 }}>{children}</Typography.Paragraph>
)
AnalyticsPdfPage.requiredAccess = OrganizationRequired

export default AnalyticsPdfPage
