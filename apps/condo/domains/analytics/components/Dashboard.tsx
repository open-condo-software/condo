import {
    TicketStatusTypeType,
    TicketAnalyticsGroupBy,
    IncidentStatusType,
    TicketQualityControlValueType,
} from '@app/condo/schema'
import { Row, Col, Skeleton, Result } from 'antd'
import Big from 'big.js'
import dayjs, { Dayjs } from 'dayjs'
import ReactECharts from 'echarts-for-react'
import get from 'lodash/get'
import isNull from 'lodash/isNull'
import { useRouter } from 'next/router'
import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react'

import { Wallet, LayoutList } from '@open-condo/icons'
import { useLazyQuery } from '@open-condo/next/apollo'
import { useIntl } from '@open-condo/next/intl'
import { Card, Typography, Space, Select } from '@open-condo/ui'
import { colors } from '@open-condo/ui/dist/colors'

import TicketChart, { EchartsSeries } from '@condo/domains/analytics/components/TicketChart'
import { OVERVIEW_DASHBOARD_MUTATION } from '@condo/domains/analytics/gql'
import { getAggregatedData } from '@condo/domains/analytics/utils/helpers'
import DateRangePicker from '@condo/domains/common/components/Pickers/DateRangePicker'
import { getClientSideSenderInfo } from '@condo/domains/common/utils/userid.utils'
import { Resident } from '@condo/domains/resident/utils/clientSchema'
import { Ticket as TicketGql } from '@condo/domains/ticket/gql'
import { Incident, Ticket } from '@condo/domains/ticket/utils/clientSchema'
import { GET_TICKETS_COUNT_QUERY } from '@condo/domains/ticket/utils/clientSchema/search'

import PaymentChart from './PaymentChart'
import { PaymentChartView } from './PaymentChartView'
import TicketChartView from './TicketChartView'

import type { RowProps } from 'antd'

const DASHBOARD_ROW_GUTTER: RowProps['gutter'] = [20, 40]

const DataCard: React.FC<{ label: string, value: string | number }> = ({ label, value }) => (
    <Col>
        <Space direction='vertical' align='center' size={8}>
            <Space size={8} direction='horizontal' align='start'>
                <Typography.Title level={3} type='primary'>{value}</Typography.Title>
            </Space>
            <Row>
                <Typography.Text type='secondary'>{label}</Typography.Text>
            </Row>
        </Space>
    </Col>
)

const PerformanceCard = ({ organizationId, paymentSum, receiptSum, paymentLoading }) => {
    const intl = useIntl()
    const DoneLabel = intl.formatMessage({ id: 'Done' })
    const InWorkLabel = intl.formatMessage({ id: 'ticket.status.IN_PROGRESS.name' })
    const PaymentsAmountPercent = intl.formatMessage({ id: 'pages.reports.paymentsAmountPercent' })
    const PaymentsAmount = intl.formatMessage({ id: 'pages.reports.paymentsAmount' })
    const ResidentsInApp = intl.formatMessage({ id: 'pages.reports.residentsWithApp' })

    const completionPercent = useRef(null)
    const paymentsAmountPercent = useRef(null)
    const ticketCounts = useRef(null)

    const { count: residentsCount, loading: residentsLoading } = Resident.useCount({
        where: { organization: { id: organizationId } },
    })
    const [loadTicketCounts, { loading: ticketCountLoading }] = useLazyQuery(GET_TICKETS_COUNT_QUERY, {
        onCompleted: (result) => {
            ticketCounts.current = result
        },
        fetchPolicy: 'cache-first',
    })
    const [loadMonthTicketCounts, { loading: monthTicketLoading }] = useLazyQuery(GET_TICKETS_COUNT_QUERY, {
        onCompleted: (result) => {
            completionPercent.current = (result.completed.count / result.all.count * 100).toFixed(0) + '%'
        },
        fetchPolicy: 'cache-first',
    })

    useEffect(() => {
        const ticketWhere = {
            organization: { id: organizationId },
            createdAt_gte: dayjs().startOf('day').toISOString(),
            createdAt_lte: dayjs().endOf('day').toISOString(),
        }
        const ticketMonthWhere = {
            ...ticketWhere,
            createdAt_gte: dayjs().startOf('month'),
            createdAt_lte: dayjs().endOf('month'),
        }

        loadTicketCounts({ variables: { where: ticketWhere, whereWithoutStatuses: ticketWhere } })
        loadMonthTicketCounts({ variables: { where: ticketMonthWhere, whereWithoutStatuses: ticketMonthWhere } })
    }, [organizationId, loadTicketCounts, loadMonthTicketCounts])

    useEffect(() => {
        if (!paymentLoading && !isNull(paymentSum) && !isNull(receiptSum)) {
            paymentsAmountPercent.current = Big(paymentSum).div(receiptSum).mul(100).round(0).toString() + '%'
        }
    }, [receiptSum, paymentSum, paymentLoading])

    const loading = monthTicketLoading || ticketCountLoading || isNull(ticketCounts.current)

    return (
        <Card title={<Typography.Title level={3}>Сводка сегодня</Typography.Title>}>
            {loading || residentsLoading || paymentLoading ? (
                <Skeleton loading paragraph={{ rows: 3 }} />
            ) : (
                <Row gutter={DASHBOARD_ROW_GUTTER}>
                    <Col span={24}>
                        <Row align='middle' justify='space-between'>
                            <LayoutList />
                            <DataCard label={DoneLabel} value={completionPercent.current} />
                            <DataCard label='Новые' value={ticketCounts.current.new_or_reopened.count} />
                            <DataCard label={InWorkLabel} value={ticketCounts.current.processing.count} />
                            <DataCard label='Закрытые' value={ticketCounts.current.closed.count} />
                        </Row>
                    </Col>
                    <Col span={24}>
                        <Row align='middle' justify='space-between'>
                            <Wallet />
                            <DataCard
                                label={PaymentsAmountPercent}
                                value={paymentsAmountPercent.current}
                            />
                            <DataCard
                                label={PaymentsAmount}
                                value={intl.formatNumber(paymentSum, { style: 'currency', currency: 'Rub' })}
                            />
                            <DataCard
                                label={ResidentsInApp}
                                value={residentsCount}
                            />
                        </Row>
                    </Col>
                </Row>
            )}
        </Card>
    )
}

const IncidentDashboard = ({ organizationId }) => {
    const intl = useIntl()
    const IncidentsTitle = intl.formatMessage({ id: 'pages.reports.incidentsTitle' })

    const { push } = useRouter()

    const { loading, count } = Incident.useCount({
        where: { organization: { id: organizationId }, status: IncidentStatusType.Actual },
    })

    const onCardClick = useCallback(async () => {
        await push('/incidents')
    }, [push])

    const incidentCardContent = useMemo(() => (
        <Row style={{ minHeight: '158px' }}>
            <Col span={24}>
                <Result
                    style={{ padding: '26px 32px' }}
                    status={count > 0 ? 'error' : 'success'}
                    title={<Typography.Text>
                        {intl.formatMessage({ id: 'pages.reports.activeIncidents' }, { count })}
                    </Typography.Text>}
                />
            </Col>
        </Row>
    ), [count, intl])

    return (
        <Card
            title={<Typography.Title level={3}>{IncidentsTitle}</Typography.Title>}
            onClick={onCardClick}
            hoverable
            bodyPadding={8}
        >
            {loading ? <Skeleton active paragraph={{ rows: 3 }} /> : incidentCardContent}
        </Card>
    )
}

const TicketQualityControlDashboard = ({ organizationId }) => {
    const intl = useIntl()
    const QualityControlTitle = intl.formatMessage({ id: 'ticket.qualityControl' })

    const { count: goodCount, loading: goodLoading } = Ticket.useCount({
        where: {
            organization: { id: organizationId },
            status: { type: TicketStatusTypeType.Completed },
            qualityControlValue: TicketQualityControlValueType.Good,
            AND: [
                { createdAt_gte: dayjs().startOf('month').toISOString() },
                { createdAt_lte: dayjs().endOf('month').toISOString() },
            ],
        },
    })
    const { count: badCount, loading: badLoading } = Ticket.useCount({
        where: {
            organization: { id: organizationId },
            status: { type: TicketStatusTypeType.Completed },
            qualityControlValue: TicketQualityControlValueType.Bad,
            AND: [
                { createdAt_gte: dayjs().startOf('month').toISOString() },
                { createdAt_lte: dayjs().endOf('month').toISOString() },
            ],
        },
    })

    const ticketCardContent = useMemo(() => {
        const option = {
            series: [
                {
                    type: 'gauge',
                    startAngle: 180,
                    endAngle: 0,
                    center: ['50%', '75%'],
                    radius: '100%',
                    min: 0,
                    max: 1,
                    splitNumber: 8,
                    axisLine: {
                        lineStyle: {
                            width: 6,
                            color: [
                                [0.5, colors.red['5']],
                                [1, colors.green['5']],
                            ],
                        },
                    },
                    pointer: {
                        icon: 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z',
                        length: '12%',
                        width: 20,
                        offsetCenter: [0, '-60%'],
                        itemStyle: {
                            color: '#222',
                        },
                    },
                    axisTick: {
                        length: 12,
                        lineStyle: {
                            color: 'inherit',
                            width: 2,
                        },
                    },
                    splitLine: { show: false },
                    axisLabel: {
                        show: false,
                        color: '#222',
                        fontSize: 20,
                        distance: -60,
                        rotate: 'tangential',
                        formatter: function (value) {
                            if (value === 0.875) {
                                return 'Grade A'
                            } else if (value === 0.625) {
                                return 'Grade B'
                            } else if (value === 0.375) {
                                return 'Grade C'
                            } else if (value === 0.125) {
                                return 'Grade D'
                            }
                            return ''
                        },
                    },
                    title: {
                        offsetCenter: [0, '25%'],
                        fontSize: 16,
                    },
                    detail: {
                        fontSize: 28,
                        valueAnimation: true,
                        offsetCenter: [0, '-10%'],

                        formatter: function (value) {
                            return Math.round(value * 100) + ' %'
                        },
                        color: 'inherit',
                    },
                    data: [
                        {
                            value: goodCount / (badCount + goodCount),
                            name: intl.formatMessage({ id: 'pages.reports.ticketFeedbackCount' }, { count: goodCount + badCount }),
                        },
                    ],
                },
            ],
        }
        return (
            <Row style={{ height: '182px' }}>
                <Col span={24}>
                    <ReactECharts
                        opts={{ renderer: 'svg' }}
                        option={option}
                        style={{ height: '100%', width: '100%' }}
                    />
                </Col>
            </Row>
        )
    }, [goodCount, badCount, intl])

    return (
        <Card
            title={<Typography.Title level={3}>{QualityControlTitle}</Typography.Title>}
            bodyPadding={12}
        >
            {goodLoading || badLoading ? <Skeleton active paragraph={{ rows: 3 }} /> : ticketCardContent}
        </Card>
    )
}

const TicketChartContainer = ({ data, groupBy, isStacked = false, isYValue = false, title, topValues = 0, sliceWords = false }) => {

    const mapperInstance = new TicketChart({
        bar: {
            chart: (viewMode, ticketGroupedCounter) => {
                const aggregatedData = getAggregatedData(
                    ticketGroupedCounter,
                    groupBy,
                )

                let axisLabels = Array.from(new Set(Object.values(aggregatedData).flatMap(e => Object.keys(e))))
                const series = []

                if (topValues) {
                    axisLabels = []
                    Object.entries(aggregatedData).map(([groupBy, dataObj]) => {
                        const sortedValues = Object.entries(dataObj).sort(([,a], [,b]) => b - a)

                        const seriesConfig = {
                            name: groupBy,
                            type: viewMode,
                            symbol: 'none',
                            data: [],
                            stack: isStacked ? 'total' : groupBy,
                            emphasis: {
                                focus: 'none',
                                blurScope: 'none',
                            },
                        }

                        for (const [key, value] of sortedValues) {
                            if (seriesConfig.data.length === topValues) {
                                break
                            }
                            seriesConfig.data.push(value)
                            axisLabels.push(key)
                        }

                        series.push(seriesConfig)
                    })
                } else {
                    Object.entries(aggregatedData).map(([groupBy, dataObj]) => {
                        series.push({
                            name: groupBy,
                            type: viewMode,
                            symbol: 'none',
                            stack: isStacked ? 'total' : groupBy,
                            data: Object.values(dataObj),
                            emphasis: {
                                focus: 'none',
                                blurScope: 'none',
                            },
                        })
                    })
                }

                const valueData = { type: 'value', data: null }
                const categoryData = { type: 'category', data: axisLabels, axisLabel: {
                    formatter: (val) => {
                        return val.length > 12 && sliceWords ? val.slice(0, 12) + '\n' + val.slice(12, val.length) : val
                    },
                } }

                const axisData = {
                    yAxis: isYValue ? categoryData : valueData,
                    xAxis: isYValue ? valueData : categoryData,
                }
                const tooltip = { trigger: 'axis', axisPointer: { type: 'line' } }

                return { series, legend: [], axisData, tooltip }
            },
            table: () => null,
        },
    })

    return (
        <Row gutter={[0, 16]}>
            <Col span={24}>
                <Typography.Title level={3}>{title}</Typography.Title>
            </Col>
            <Col span={24}>
                <TicketChartView
                    data={data}
                    mainGroup='status'
                    viewMode='bar'
                    mapperInstance={mapperInstance}
                    chartConfig={{ animationEnabled: false, chartOptions: { renderer: 'canvas', height: 300 } }}
                />
            </Col>
        </Row>
    )
}

const PaymentChartContainer = ({ data, title, viewMode }) => {
    const intl = useIntl()
    const SumTitle = intl.formatMessage({ id: 'global.sum' })
    const PaymentCountTitle = intl.formatMessage({ id: 'pages.reports.paymentCount' })

    const mapperInstance = new PaymentChart({
        barSummary: {
            chart: (viewMode, payments) => {
                const paymentsCount = payments.map(payment => [payment.dayGroup, Number(payment.count)])
                const maxCount = Math.max(...paymentsCount.map(([, value]) => value))
                const series: Array<EchartsSeries> = [
                    {
                        name: SumTitle,
                        data: payments.map(payment => [payment.dayGroup, Number(payment.sum).toFixed(2)]),
                        type: 'bar',
                        label: { show: true, position: 'top' },
                        barMaxWidth: 40,
                    },
                    {
                        name: PaymentCountTitle,
                        data: paymentsCount,
                        type: 'line',
                        yAxisIndex: 1,
                    },
                ]

                return {
                    legend: [SumTitle, PaymentCountTitle],
                    tooltip: { trigger: 'axis', axisPointer: { type: 'line' } },
                    axisData: {
                        yAxis: [
                            { type: 'value', data: null },
                            {
                                type: 'value',
                                data: null,
                                min: 0,
                                max: maxCount + Math.round(maxCount / 2),
                                axisLabel: {
                                    formatter: (value) => {
                                        return value % 1 === 0 ? value : ''
                                    },
                                },
                            },
                        ],
                        xAxis: {
                            type: 'category',
                            data: null,
                            axisLabel: {
                                formatter: (value) => dayjs(value).format('MMM, YYYY'),
                            },
                        },
                    },
                    series,
                }
            },
        },
        bar: {
            chart: (viewMode, dataset) => {
                const series: Array<EchartsSeries> = [
                    {
                        name: 'Начислено',
                        data: dataset[1].map(receipt => [receipt.dayGroup, Number(receipt.sum).toFixed(2)]),
                        type: viewMode,
                        label: { show: true, position: 'top' },
                    },
                    {
                        name: 'Оплачено',
                        data: dataset[0].map(payment => [payment.dayGroup, Number(payment.sum).toFixed(2)]),
                        type: viewMode,
                        label: { show: true, position: 'top' },
                    },
                ]

                return {
                    legend: ['Начислено', 'Оплачено'],
                    tooltip: { trigger: 'axis', axisPointer: { type: 'line' } },
                    axisData: {
                        yAxis: {
                            type: 'value',
                            data: null,
                        },
                        xAxis: {
                            type: 'category',
                            data: null,
                            axisLabel: {
                                formatter: (value) => dayjs(value).format('MMM, YYYY'),
                            },
                        },
                    },
                    series,
                }
            },
        },
    })

    return (
        <Row gutter={[0, 16]}>
            <Col span={24}>
                <Typography.Title level={3}>{title}</Typography.Title>
            </Col>
            <Col span={24}>
                <PaymentChartView
                    data={data}
                    viewMode={viewMode}
                    mapperInstance={mapperInstance}
                    loading={false}
                    chartConfig={{ chartOptions: { height: 300 }, animationEnabled: true }}
                />
            </Col>
        </Row>
    )
}

const TicketTableView = ({ organizationId }) => {
    // const { objs: processingTickets } = Ticket.useObjects({
    //     where: {
    //         organization: { id: organizationId },
    //         status: { type: TicketStatusTypeType.Processing },
    //     },
    // })

    // const { objs: overdueTickets } = Ticket.useObjects({
    //     where: {
    //         organization: { id: organizationId },
    //         deadline_lt: dayjs().toISOString(),
    //         status: { type_not_in: [TicketStatusTypeType.Completed, TicketStatusTypeType.Closed] },
    //     },
    // })

    const [loadOverdueTickets, { loading: overdueTicketsLoading }] = useLazyQuery(TicketGql.GET_ALL_OBJS_QUERY, {
        onCompleted: (response) => {
            console.log('overdue tickets')
            console.log(response)
        },
        onError: (error) => {
            console.log('error load overdue tickets')
            console.log(error)
        },
    })

    // console.log(overdueTickets)

    useEffect(() => {
        loadOverdueTickets({
            variables: {
                where: {
                    organization: { id: organizationId },
                    OR: [
                        {
                            AND: [
                                { completedAt_not: null },
                            ],
                        },
                    ],
                    AND: [
                        { deadline_not: null },
                        { deadline_lt: dayjs().toISOString() },
                    ],
                    // OR: [
                    //     { status: { type: TicketStatusTypeType.NewOrReopened } },
                    //     { status: { type: TicketStatusTypeType.Processing } },
                    // ],
                },
            },
        })
    }, [organizationId, loadOverdueTickets])

    // console.log(processingTickets)
    // console.log(overdueTickets)
    return <>table here</>
}

export const Dashboard: React.FC<{ organizationId: string }> = ({ organizationId }) => {
    const intl = useIntl()
    const NewTicketsTitle = intl.formatMessage({ id: 'pages.reports.newTicketsTitle' })
    const TicketsByPropertyTitle = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.groupByFilter.Property' })
    const TicketsByCategory = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.groupByFilter.Category' })
    const PaymentsTotalTitle = intl.formatMessage({ id: 'pages.reports.paymentsTotal' })

    const [overview, setOverview] = useState(null)
    const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([dayjs().subtract(1, 'month'), dayjs()])
    const [aggregatePeriod, setAggregatePeriod] = useState<'day' | 'week' | 'month'>('day')

    const [loadDashboardData, { loading }] = useLazyQuery(OVERVIEW_DASHBOARD_MUTATION, {
        onCompleted: (response) => {
            const { result } = response
            setOverview(result.overview)
        },
        onError: error => {console.log(error)},
    })

    useEffect(() => {
        loadDashboardData({ variables: {
            data: { dv: 1, sender: getClientSideSenderInfo(),
                where: {
                    organization: organizationId,
                    dateFrom: dateRange[0].toISOString(),
                    dateTo: dateRange[1].toISOString(),
                },
                groupBy: {
                    aggregatePeriod,
                },
            },
        } })
    }, [organizationId, loadDashboardData, dateRange, aggregatePeriod])

    const onAggregatePeriodChange = useCallback((aggregatePeriod) => {
        setAggregatePeriod(aggregatePeriod)
    }, [])

    const aggregateOptions = useMemo(() => [
        { label: 'День', value: 'day' },
        { label: 'Неделя', value: 'week' },
        { label: 'Месяц', value: 'month' },
    ], [])

    const newTickets = get(overview, 'ticketByDay.ticketCounts', [])
        .filter(e => e.status === get(overview, 'ticketByDay.translates.status', [])
            .find(e => e.type === TicketStatusTypeType.NewOrReopened).label)

    const propertyTickets = get(overview, 'ticketByProperty.ticketCounts')
    const categoryTickets = get(overview, 'ticketByCategory.ticketCounts', [])
        .filter(e => e.status === get(overview, 'ticketByDay.translates.status', [])
            .find(e => e.type === TicketStatusTypeType.NewOrReopened).label)
    const paymentsData = get(overview, 'payment.payments')
    const paymentSum = get(overview, 'payment.sum', null)
    const receiptsData = get(overview, 'receipt.receipts')
    const receiptSum = get(overview, 'receipt.sum', null)

    return (
        <Row gutter={DASHBOARD_ROW_GUTTER}>
            <Col lg={12} md={24}>
                <PerformanceCard organizationId={organizationId} paymentSum={paymentSum} receiptSum={receiptSum} paymentLoading={false} />
            </Col>
            <Col lg={6} md={24}>
                <IncidentDashboard organizationId={organizationId} />
            </Col>
            <Col lg={6} md={24}>
                <TicketQualityControlDashboard organizationId={organizationId} />
            </Col>
            <Col span={24}>
                <Space direction='horizontal' size={16}>
                    <DateRangePicker value={dateRange} onChange={setDateRange} allowClear={false} />
                    <Select
                        value={aggregatePeriod}
                        onChange={onAggregatePeriodChange}
                        options={aggregateOptions}
                    />
                </Space>
            </Col>
            {loading || overview === null ? (
                <Skeleton paragraph={{ rows: 5 }} />
            ) : (
                <Col span={24}>
                    <Row gutter={DASHBOARD_ROW_GUTTER}>
                        <Col lg={12} md={24}>
                            <TicketChartContainer
                                title={NewTicketsTitle}
                                data={newTickets}
                                groupBy={[TicketAnalyticsGroupBy.Status, TicketAnalyticsGroupBy.Day]}
                            />
                        </Col>
                        <Col lg={12} md={24}>
                            <TicketChartContainer
                                title={TicketsByCategory}
                                data={categoryTickets}
                                groupBy={[TicketAnalyticsGroupBy.Status, TicketAnalyticsGroupBy.CategoryClassifier]}
                                isStacked
                                topValues={5}
                                sliceWords
                            />
                        </Col>
                        {/*<Col span={24}>*/}
                        {/*    <TicketTableView organizationId={organizationId} />*/}
                        {/*</Col>*/}
                        <Col lg={12} md={24}>
                            <PaymentChartContainer
                                title={PaymentsTotalTitle}
                                data={paymentsData}
                                viewMode='barSummary'
                            />
                        </Col>
                        <Col lg={12} md={24}>
                            <PaymentChartContainer
                                title='Начислено / оплачено'
                                data={[paymentsData, receiptsData]}
                                viewMode='bar'
                            />
                        </Col>
                        <Col lg={12} md={24}>
                            <TicketChartContainer
                                title={TicketsByPropertyTitle}
                                data={propertyTickets}
                                groupBy={[TicketAnalyticsGroupBy.Status, TicketAnalyticsGroupBy.Property]}
                                isStacked
                                isYValue
                            />
                        </Col>
                    </Row>
                </Col>
            )}
        </Row>
    )
}
