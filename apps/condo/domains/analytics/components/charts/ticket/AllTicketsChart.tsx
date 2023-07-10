import { TicketAnalyticsGroupBy as TicketGroupBy, TicketGroupedCounter } from '@app/condo/schema'
import { Row, Col } from 'antd'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/dist/colors'

import TicketChart from '@condo/domains/analytics/components/TicketChart'
import TicketChartView from '@condo/domains/analytics/components/TicketChartView'
import { getAggregatedData } from '@condo/domains/analytics/utils/helpers'

const COLOR_SET = [
    colors.pink['5'],
    colors.orange['5'],
    colors.green['5'],
    colors.brown['5'],
    colors.blue['5'],
    colors.teal['5'],
]

const AllTicketChartDataMapper = new TicketChart({
    line: {
        chart: (viewMode, data) => {
            const series = []
            const aggregatedData = getAggregatedData(data, [TicketGroupBy.Status, TicketGroupBy.Day])
            const axisLabels = Array.from(new Set(Object.values(aggregatedData).flatMap(e => Object.keys(e))))

            Object.entries(aggregatedData).map(([groupBy, dataObj], index) => {
                series.push({
                    name: groupBy,
                    type: viewMode,
                    symbol: 'none',
                    stack: 'total',
                    data: Object.values(dataObj),
                    smooth: true,
                    lineStyle: { color: 'transparent' },
                    areaStyle: { color: COLOR_SET[index] },
                    emphasis: {
                        focus: 'series',
                    },
                })
            })

            return {
                legend: [],
                axisData: {
                    xAxis: { type: 'category', data: axisLabels },
                    yAxis: { type: 'value', data: null },
                },
                tooltip: { trigger: 'axis', axisPointer: { type: 'line' } },
                series,
            }
        },
        table: () => null,
    },
})

interface IAllTicketsChart {
    ({ data }: { data: Array<TicketGroupedCounter> }): React.ReactElement
}

const AllTicketsChart: IAllTicketsChart = ({ data }) => {
    const intl = useIntl()
    const ChartTitle = intl.formatMessage({ id: 'pages.reports.newTicketsTitle' })

    return (
        <Row gutter={[0, 16]}>
            <Col span={24}>
                <Typography.Title level={3}>{ChartTitle}</Typography.Title>
            </Col>
            <Col span={24}>
                <TicketChartView
                    data={data}
                    mainGroup='status'
                    viewMode='line'
                    mapperInstance={AllTicketChartDataMapper}
                    chartConfig={{ chartOptions: { height: 300 }, animationEnabled: true }}
                />
            </Col>
        </Row>
    )
}

export { AllTicketsChart }
