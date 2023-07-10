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

const TOP_VALUES = 5

const TicketByCategoryDataMapper = new TicketChart({
    bar: {
        chart: (viewMode, data) => {
            const series = []

            const aggregatedData = getAggregatedData(data, [TicketGroupBy.Status, TicketGroupBy.CategoryClassifier], true)
            const axisLabels = Object.keys(aggregatedData.summary)
                .sort((firstLabel, secondLabel) => aggregatedData.summary[secondLabel] - aggregatedData.summary[firstLabel])
                .slice(0, TOP_VALUES)

            Object.entries(aggregatedData).map(([groupBy, dataObj], index) => {
                const seriesConfig = {
                    name: groupBy,
                    type: viewMode,
                    symbol: 'none',
                    data: [],
                    stack: 'total',
                    emphasis: {
                        focus: 'none',
                        blurScope: 'none',
                    },
                    barMaxWidth: 40,
                }
                axisLabels.forEach(axisLabel => {
                    seriesConfig.data.push(dataObj[axisLabel])
                })

                series.push(seriesConfig)
            })

            const valueData = { type: 'value', data: null, boundaryGap: [0, 0.02] }
            const categoryData = {
                type: 'category',
                data: axisLabels,
                axisLabel: {
                    show: true,
                    formatter: (val) => {
                        return val.length > 12 ? val.slice(0, 12) + '\n' + val.slice(12, val.length) : val
                    },
                },
                axisTick: { alignWithLabel: true },
            }

            const axisData = {
                yAxis: valueData,
                xAxis: categoryData,
            }
            const tooltip = { trigger: 'axis', axisPointer: { type: 'line' } }

            return {
                series,
                legend: [],
                axisData,
                tooltip,
                color: COLOR_SET,
            }
        },
        table: () => null,
    },
})

interface ITicketByCategoryChart {
    ({ data }: { data: Array<TicketGroupedCounter> }): React.ReactElement
}

const TicketByCategoryChart: ITicketByCategoryChart = ({ data }) => {
    const intl = useIntl()
    const TicketTitle = intl.formatMessage({ id: 'global.section.tickets' })
    const TicketsByCategory = intl.formatMessage({ id: 'pages.condo.analytics.TicketAnalyticsPage.groupByFilter.Category' })

    return (
        <Row gutter={[0, 16]}>
            <Col span={24}>
                <Typography.Title level={3}>{TicketTitle} {TicketsByCategory.toLowerCase()}</Typography.Title>
            </Col>
            <Col span={24}>
                <TicketChartView
                    data={data}
                    viewMode='bar'
                    mapperInstance={TicketByCategoryDataMapper}
                    chartConfig={{ chartOptions: { height: 300 }, animationEnabled: true }}
                />
            </Col>
        </Row>
    )
}

export { TicketByCategoryChart }
