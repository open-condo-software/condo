import { TicketStatusTypeType, TicketAnalyticsGroupBy } from '@app/condo/schema'
import { Row, Col, Skeleton } from 'antd'
import dayjs, { Dayjs } from 'dayjs'
import get from 'lodash/get'
import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react'

import { useLazyQuery } from '@open-condo/next/apollo'
import { useIntl } from '@open-condo/next/intl'
import { Card, Typography, Space, Select } from '@open-condo/ui'


import TicketChart, { EchartsSeries } from '@condo/domains/analytics/components/TicketChart'
import { OVERVIEW_DASHBOARD_MUTATION } from '@condo/domains/analytics/gql'
import DateRangePicker from '@condo/domains/common/components/Pickers/DateRangePicker'
import { getClientSideSenderInfo } from '@condo/domains/common/utils/userid.utils'
import { Resident } from '@condo/domains/resident/utils/clientSchema'
import { GET_TICKETS_COUNT_QUERY } from '@condo/domains/ticket/utils/clientSchema/search'

import PaymentChart from './PaymentChart'
import { PaymentChartView } from './PaymentChartView'
import TicketChartView from './TicketChartView'

import { getAggregatedData } from '../utils/helpers'

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

const PerformanceCard = ({ organizationId }) => {
    const intl = useIntl()
    const DoneLabel = intl.formatMessage({ id: 'Done' })
    const InWorkLabel = intl.formatMessage({ id: 'ticket.status.IN_PROGRESS.name' })

    const [loading, setLoading] = useState(true)

    const completionPercent = useRef('0%')
    const ticketCounts = useRef(null)

    const { count: residentsCount, loading: residentsLoading } = Resident.useCount({
        where: { organization: { id: organizationId } },
    })
    const [loadTicketCounts] = useLazyQuery(GET_TICKETS_COUNT_QUERY, {
        onCompleted: (result) => {
            completionPercent.current = (result.completed.count / result.all.count * 100).toFixed(0) + ' %'
            ticketCounts.current = result
            setLoading(false)
        },
    })

    useEffect(() => {
        loadTicketCounts({
            variables: {
                where: { organization: { id: organizationId } },
                whereWithoutStatuses: { organization: { id: organizationId } },
            },
        })
    }, [organizationId, loadTicketCounts])

    if (loading || residentsLoading) {
        return <Skeleton loading paragraph={{ rows: 3 }} />
    }

    return (
        <Card title={<Typography.Title level={3}>Сводка сегодня</Typography.Title>} bodyPadding={12}>
            <Row gutter={DASHBOARD_ROW_GUTTER}>
                <Col span={24}>
                    <Row align='top' justify='space-evenly'>
                        <DataCard label={DoneLabel} value={completionPercent.current} />
                        <DataCard label='Новые' value={ticketCounts.current.new_or_reopened.count} />
                        <DataCard label={InWorkLabel} value={ticketCounts.current.processing.count} />
                        <DataCard label='Закрытые' value={ticketCounts.current.closed.count} />
                    </Row>
                </Col>
                <Col span={24}>
                    <Row align='top' justify='space-evenly'>
                        <DataCard label='Сбор' value='98%' />
                        <DataCard label='Сумма оплат' value='300kk' />
                        <DataCard label='Жителей в приложении' value={residentsCount} />
                    </Row>
                </Col>
            </Row>
        </Card>
    )
}

const TicketChartContainer = ({ data, groupBy, isStacked = false, isYValue = false, title, topValues = 0 }) => {

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
                        return val.length > 12 ? val.slice(0, 12) + '\n' + val.slice(12, val.length) : val
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

const PaymentChartContainer = ({ data, title }) => {
    const mapperInstance = new PaymentChart({
        barSummary: {
            chart: (viewMode, payments) => {
                const paymentsCount = payments.map(payment => [payment.dayGroup, Number(payment.count)])
                const maxCount = Math.max(...paymentsCount.map(([, value]) => value))
                const series: Array<EchartsSeries> = [
                    {
                        name: 'Сумма',
                        data: payments.map(payment => [payment.dayGroup, Number(payment.sum).toFixed(2)]),
                        type: 'bar',
                        label: { show: true, position: 'top' },
                    },
                    {
                        name: 'Количество оплат',
                        data: paymentsCount,
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
    const NewTicketsTitle = intl.formatMessage({ id: 'pages.reports.newTicketsTitle' })
    const TicketsByPropertyTitle = intl.formatMessage({ id: 'pages.reports.ticketsByProperty' })
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
    const paymentsData = get(overview, 'payment.aggregatedPayments')

    return (
        <Row gutter={DASHBOARD_ROW_GUTTER}>
            <Col lg={12} md={24}>
                <PerformanceCard organizationId={organizationId} />
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
            {loading || overview === null ? (
                <Skeleton paragraph={{ rows: 5 }} />
            ) : (
                <Col span={24}>
                    <Row gutter={DASHBOARD_ROW_GUTTER}>
                        <Col span={12}>
                            <TicketChartContainer
                                title={NewTicketsTitle}
                                data={newTickets}
                                groupBy={[TicketAnalyticsGroupBy.Status, TicketAnalyticsGroupBy.Day]}
                            />
                        </Col>
                        <Col span={12}>
                            <TicketChartContainer
                                title='Заявки по категориям'
                                data={categoryTickets}
                                groupBy={[TicketAnalyticsGroupBy.Status, TicketAnalyticsGroupBy.CategoryClassifier]}
                                isStacked
                                topValues={5}
                            />
                        </Col>
                        <Col span={12}>
                            <PaymentChartContainer
                                title={PaymentsTotalTitle}
                                data={paymentsData}
                            />
                        </Col>
                        <Col span={12}>
                            tut sbor
                        </Col>
                        <Col span={12}>
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
