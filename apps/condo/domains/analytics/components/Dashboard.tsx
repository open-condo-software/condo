import { TicketStatusTypeType, TicketAnalyticsGroupBy } from '@app/condo/schema'
import { Row, Col, Skeleton } from 'antd'
import dayjs, { Dayjs } from 'dayjs'
import get from 'lodash/get'
import groupBy from 'lodash/groupBy'
import React, { useEffect, useMemo, useState, useCallback } from 'react'

import { useLazyQuery } from '@open-condo/next/apollo'
import { useIntl } from '@open-condo/next/intl'
import { Card, Typography, Space, Select } from '@open-condo/ui'

import TicketChart, { EchartsSeries } from '@condo/domains/analytics/components/TicketChart'
import { OVERVIEW_DASHBOARD_MUTATION } from '@condo/domains/analytics/gql'
import DateRangePicker from '@condo/domains/common/components/Pickers/DateRangePicker'
import { getClientSideSenderInfo } from '@condo/domains/common/utils/userid.utils'

import PaymentChart from './PaymentChart'
import { PaymentChartView } from './PaymentChartView'
import TicketChartView from './TicketChartView'

import { getAggregatedData } from '../utils/helpers'

import type { RowProps } from 'antd'

const DASHBOARD_ROW_GUTTER: RowProps['gutter'] = [20, 40]
const ENABLED_TICKET_STATUSES = [
    TicketStatusTypeType.NewOrReopened,
    TicketStatusTypeType.Processing,
    TicketStatusTypeType.Closed,
]

const PerformanceCard = ({ tickets }) => {
    const intl = useIntl()
    const DoneLabel = intl.formatMessage({ id: 'Done' })

    const ticketGroups = groupBy(get(tickets, 'ticketCounts', []), 'status')
    const ticketTranslates = get(tickets, 'translates', [])
    const statusMap = Object.fromEntries(ticketTranslates.status.map(status => [status.label, status.type]))

    const completionPercent = useMemo(() => {
        const completedLabel = ticketTranslates.status.find(e => e.type === TicketStatusTypeType.Completed).label
        const completedTicketsCount = ticketGroups[completedLabel].reduce((prev, curr) => prev + curr.count, 0)
        const totalTickets = Object.values(ticketGroups).reduce((prev, curr) => {
            return prev + curr.reduce((prev, curr) => prev + curr.count, 0)
        }, 0)

        return (completedTicketsCount / totalTickets * 100).toFixed(0) + ' %'
    }, [ticketTranslates, ticketGroups])

    return (
        <Card title={<Typography.Title level={3}>Performance</Typography.Title>} bodyPadding={12}>
            <Row gutter={DASHBOARD_ROW_GUTTER}>
                <Col span={24}>
                    <Space direction='horizontal' size={12}>
                        <Card>
                            <Row gutter={[0, 12]}>
                                <Col span={24}>
                                    <Typography.Text>{DoneLabel}</Typography.Text>
                                </Col>
                                <Col span={24}>
                                    <Typography.Title level={3}>
                                        {completionPercent}
                                    </Typography.Title>
                                </Col>
                            </Row>
                        </Card>
                        {Object.entries(ticketGroups).map(([label, values]) => {
                            if (ENABLED_TICKET_STATUSES.includes(statusMap[label])) {
                                return (
                                    <Card key={label}>
                                        <Row gutter={[0, 12]}>
                                            <Col span={24}>
                                                <Typography.Text>{label}</Typography.Text>
                                            </Col>
                                            <Col span={24}>
                                                <Typography.Title level={3}>
                                                    {values.reduce((prev, curr) => prev + curr.count, 0)}
                                                </Typography.Title>
                                            </Col>
                                        </Row>
                                    </Card>
                                )
                            }
                            return null
                        })}
                    </Space>
                </Col>
            </Row>
        </Card>
    )
}

const TicketChartContainer = ({ data, groupBy, isStacked = false, isYValue = false, title }) => {
    const mapperInstance = new TicketChart({
        bar: {
            chart: (viewMode, ticketGroupedCounter) => {
                const aggregatedData = getAggregatedData(
                    ticketGroupedCounter,
                    groupBy,
                )
                const axisLabels = Array.from(new Set(Object.values(aggregatedData).flatMap(e => Object.keys(e))))
                const series = []
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
                const valueData = { type: 'value', data: null }
                const categoryData = { type: 'category', data: axisLabels }

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

const PaymentChartContainer = ({ data, title, dateFilter }) => {
    const mapperInstance = new PaymentChart({
        barSummary: {
            chart: (viewMode, payments) => {
                const entries = Object.entries(groupBy(payments, 'period'))

                const series: Array<EchartsSeries> = [
                    {
                        name: 'Сумма',
                        data: entries
                            .map(([date, values]) => [date, values.reduce((prev, curr) => prev + Number(curr.amount), 0)]),
                        type: 'bar',
                        label: { show: true, position: 'top' },
                    },
                    {
                        name: 'Количество оплат',
                        data: entries.map(([date, values]) => [date, values.length]),
                        type: 'line',
                        yAxisIndex: 1,
                    },
                ]

                return {
                    legend: ['Сумма', 'Количество оплат'],
                    tooltip: { trigger: 'axis', axisPointer: { type: 'line' } },
                    axisData: {
                        yAxis: [
                            { type: 'value', data: null },
                            { type: 'value', data: null },
                        ],
                        xAxis: {
                            type: 'category',
                            data: null,
                            axisLabel: {
                                formatter: (value) => {
                                    return dayjs(value).format('MMM, YYYY')
                                },
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
                    viewMode='barSummary'
                    mapperInstance={mapperInstance}
                    loading={false}
                    chartConfig={{ chartOptions: { height: 300 }, animationEnabled: true }}
                />
            </Col>
        </Row>
    )
}

export const Dashboard: React.FC<{ organizationId: string }> = ({ organizationId }) => {
    const intl = useIntl()

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

    if (loading || overview === null) {
        return (
            <Skeleton paragraph={{ rows: 5 }} />
        )
    }

    const newTickets = get(overview, 'ticketByDay.ticketCounts')
        .filter(e => e.status === get(overview, 'ticketByDay.translates.status', [])
            .find(e => e.type === TicketStatusTypeType.NewOrReopened).label)

    const propertyTickets = get(overview, 'ticketByProperty.ticketCounts')
    const paymentsData = get(overview, 'payment.payments')

    return (
        <Row gutter={DASHBOARD_ROW_GUTTER}>
            <Col lg={12} md={24}>
                <PerformanceCard tickets={get(overview, 'ticketByProperty')} />
            </Col>
            <Col span={24}>
                <Space direction='horizontal' size={16}>
                    <DateRangePicker value={dateRange} onChange={setDateRange} />
                    <Select
                        value={aggregatePeriod}
                        onChange={onAggregatePeriodChange}
                        options={aggregateOptions}
                    />
                </Space>
            </Col>
            <Col span={24}>
                <Row gutter={DASHBOARD_ROW_GUTTER}>
                    <Col span={12}>
                        <TicketChartContainer
                            title='Новые заявки'
                            data={newTickets}
                            groupBy={[TicketAnalyticsGroupBy.Status, TicketAnalyticsGroupBy.Day]}
                        />
                    </Col>
                    <Col span={12}>
                        <TicketChartContainer
                            title='Заявки по домам'
                            data={propertyTickets}
                            groupBy={[TicketAnalyticsGroupBy.Status, TicketAnalyticsGroupBy.Property]}
                            isStacked
                            isYValue
                        />
                    </Col>
                    <Col span={12}>
                        <PaymentChartContainer title='Оплата квитанций' data={paymentsData} dateFilter={dateRange} />
                    </Col>
                </Row>
            </Col>
        </Row>
    )
}
