import React, { useRef,  useEffect } from 'react'
import { useIntl } from '@core/next/intl'
import { Col, Row, Skeleton, Typography } from 'antd'
import isEmpty from 'lodash/isEmpty'
import get from 'lodash/get'
import { BasicEmptyListView } from '@condo/domains/common/components/EmptyListView'
import ReactECharts from 'echarts-for-react'
import TicketChart, { ViewModeTypes } from '@condo/domains/ticket/components/TicketChart'
import { CHART_COLOR_SET } from '@condo/domains/common/constants/style'
import { TicketGroupedCounter } from '../../../../schema'
import { colors } from '@condo/domains/common/constants/style'
import { fontSizes } from '@condo/domains/common/constants/style'

export interface ITicketAnalyticsPageWidgetProps {
    data: null | TicketGroupedCounter[]
    viewMode: ViewModeTypes
    loading?: boolean
    mapperInstance: TicketChart
}

interface ITicketAnalyticsPageChartProps extends ITicketAnalyticsPageWidgetProps {
    onChartReady?: () => void
    chartConfig: {
        animationEnabled: boolean
        chartOptions?: ReactECharts['props']['opts']
    }
}

const truncate = (inputString: string) => inputString.length > 53
    ? `${inputString.substring(0, 53)}...`
    : inputString

const TicketChartView: React.FC<ITicketAnalyticsPageChartProps> = ({
    children,
    data,
    viewMode,
    loading = false,
    onChartReady,
    chartConfig,
    mapperInstance,
}) => {
    const intl = useIntl()
    const chartRefs = useRef([])
    const NoData = intl.formatMessage({ id: 'NoData' })
    let series = [], legend = []
    let axisData = {}, tooltip = {}
    if (data !== null) {
        const mapperResult = mapperInstance.getChartConfig(viewMode, data)
        series = mapperResult.series
        legend = mapperResult.legend
        axisData = mapperResult.axisData
        tooltip = mapperResult.tooltip
    }

    useEffect(() => {
        chartRefs.current = chartRefs.current.slice(0, series.length)
    }, [data])

    if (data === null || loading) {
        return <Skeleton loading={loading} active paragraph={{ rows: 12 }} />
    }
    const { animationEnabled, chartOptions } = chartConfig
    // TODO(sitozzz): find more clean solution
    if (viewMode !== 'pie') {
        const option = {
            animation: animationEnabled,
            color: CHART_COLOR_SET,
            tooltip,
            legend: {
                data: legend,
                x: 'left',
                top: 10,
                padding: [5, 135, 0, 0],
                icon: 'circle',
                itemWidth: 7,
                itemHeight: 7,
                itemGap: 28,
                textStyle: {
                    fontSize: fontSizes.content,
                },
            },
            grid: {
                left: 0,
                right: 10,
                bottom: 0,
                containLabel: true,
                borderWidth: 1,
            },
            ...axisData,
            series,
        }

        const isEmptyDataSet = Object.values(data).every(ticketStatus => {
            if (viewMode === 'line') {
                return isEmpty(ticketStatus)
            }
            return Object.values(ticketStatus).every(count => count === 0)
        }) && !loading
        const chartHeight = get(chartOptions, 'height', 'auto')
        const chartStyle = {}
        if (chartHeight !== 'auto') {
            chartStyle['height'] = chartHeight
        }

        if (viewMode === 'bar' && chartHeight === 'auto') {
            const axisLabels = get(axisData, 'yAxis.data')
            if (axisLabels && axisLabels.length > 5) {
                chartStyle['height'] = axisLabels.length * 50
            }
        }

        return <Typography.Paragraph style={{ position: 'relative' }}>
            {isEmptyDataSet ? (
                <Typography.Paragraph>
                    <BasicEmptyListView>
                        <Typography.Text>{NoData}</Typography.Text>
                    </BasicEmptyListView>
                    {children}
                </Typography.Paragraph>
            ) : (
                <>
                    <ReactECharts
                        opts={{ ...chartOptions, renderer: 'svg', height: chartHeight }}
                        onChartReady={onChartReady}
                        notMerge
                        style={{ ...chartStyle }}
                        option={option}/>
                    {children}
                </>
            )}

        </Typography.Paragraph>
    }

    const option = {
        animation: animationEnabled,
        color: CHART_COLOR_SET,
        legend: {
            data: legend,
            show: false,
        },
        tooltip: { trigger: 'item' },
    }
    const chartHeight = get(chartOptions, 'height', 'auto')
    const chartStyle = {}
    return <Typography.Paragraph style={{ position: 'relative' }}>
        {loading ? (
            <Typography.Paragraph>
                <BasicEmptyListView>
                    <Typography.Text>{NoData}</Typography.Text>
                </BasicEmptyListView>
                {children}
            </Typography.Paragraph>
        ) : (
            <>
                <ReactECharts
                    onEvents={{
                        legendselectchanged: function (params) {
                            chartRefs.current.forEach(chartRef => {
                                const chartInstance = chartRef.getEchartsInstance()
                                chartInstance._api.dispatchAction({
                                    type: 'legendToggleSelect',
                                    name: params.name,
                                })
                            })
                        },
                    }}
                    opts={{ renderer: 'svg' }}
                    notMerge
                    option={{
                        legend: {
                            data: legend,
                            top: 5,
                            show: true,
                            icon: 'circle',
                            itemWidth: 7,
                            itemHeight: 7,
                            itemGap: 10,
                            textStyle: {
                                fontSize: 16,
                            },
                            x: 'left',
                            width: '100%',
                            backgroundColor: 'white',
                        },
                        series: [{ ...series[0], top: -1000, left: -1000, labelLayout: {}, label: { show: false } }],
                        title: {
                            display: false,
                        },
                    }}
                    style={{ height: 40, overflow: 'hidden' }}
                />
                <Row gutter={[24, 40]} justify={'space-between'} align={'top'} style={{ paddingTop: 60 }} wrap>
                    {series.map((chartSeries, index) => (
                        <Col key={`pie-${index}`} style={{ maxWidth: 620 }} span={12} >
                            <ReactECharts
                                ref={element => chartRefs.current[index] = element}
                                opts={{ ...chartOptions, renderer: 'svg', height: chartHeight }}
                                // TODO(sitozzz): add onChart ready support for multiple charts
                                // onChartReady={onChartReady}
                                notMerge
                                style={{ ...chartStyle, border: '1px solid', borderColor: colors.lightGrey[6], borderRadius: 8 }}
                                option={{
                                    series: [chartSeries],
                                    title: {
                                        show: true,
                                        text: truncate(chartSeries.name.split(', ').slice(1).join(', ')),
                                        left: 375,
                                        top: 30,
                                        textStyle: {
                                            fontSize: 16,
                                            fontWeight: 700,
                                            overflow: 'breakAll',
                                            width: 160,
                                            lineHeight: 20,
                                        },
                                    },
                                    ...option }}
                            />
                        </Col>
                    ))}
                </Row>
                {children}
            </>
        )}
    </Typography.Paragraph>

}

export default TicketChartView
