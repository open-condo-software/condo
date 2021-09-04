import React, { useRef,  useEffect, useState, useCallback } from 'react'
import { useIntl } from '@core/next/intl'
import { Skeleton, Typography, List } from 'antd'
import isEmpty from 'lodash/isEmpty'
import get from 'lodash/get'
import { BasicEmptyListView } from '@condo/domains/common/components/EmptyListView'
import ReactECharts from 'echarts-for-react'
import TicketChart, { ViewModeTypes } from '@condo/domains/ticket/components/TicketChart'
import { CHART_COLOR_SET } from '@condo/domains/common/constants/style'
import { TicketGroupedCounter } from '../../../../schema'
import { colors } from '@condo/domains/common/constants/style'
import InfiniteScroll from 'react-infinite-scroller'
import { TICKET_CHART_PAGE_SIZE, MAX_CHART_NAME_LENGTH } from '@condo/domains/ticket/constants/restrictions'
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

const formatPieChartName = (propertyFullAddress: string): string => {
    const chartName = propertyFullAddress.split(', ').slice(1).join(', ')
    return chartName.length > MAX_CHART_NAME_LENGTH
        ? `${chartName.substring(0, MAX_CHART_NAME_LENGTH)}...`
        : chartName
}

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
    const NoData = intl.formatMessage({ id: 'NoData' })
    let series = [], legend = []
    let axisData = {}, tooltip = {}
    const [chartReadyCounter, setChartReadyCounter] = useState<number>(0)
    // Start from 1 because used as multiplier with TICKET_CHART_PAGE_SIZE
    const [pieChartPage, setPieChartPage] = useState(1)
    // Store pie chart refs because we need to access api for every chart component
    const chartRefs = useRef([])
    // Cache series result for client side paging
    const seriesRef = useRef([])

    if (data !== null) {
        const mapperResult = mapperInstance.getChartConfig(viewMode, data)
        seriesRef.current = mapperResult.series
        // If component used as report widget, we should use page separation. Otherwise we load all data (for pdf page)
        const pageSize = onChartReady === undefined
            ? TICKET_CHART_PAGE_SIZE * pieChartPage
            : seriesRef.current.length
        series = seriesRef.current.slice(0, pageSize)
        legend = mapperResult.legend
        axisData = mapperResult.axisData
        tooltip = mapperResult.tooltip
    }

    useEffect(() => {
        // Clean chart refs if input data was changed
        if (viewMode === 'pie') {
            // TODO(sitozzz): find way to optimize render speed
            // (with requestAnimationFrame API or something else that help us draw chart components not in one time)
            if (series.length !== chartRefs.current.length) {
                // It means that filters were changed & total chart count may be changed too, so just reset refs & page
                setChartReadyCounter(0)
                setPieChartPage(1)
            }
            chartRefs.current = chartRefs.current.slice(0, series.length)
        }
    }, [data])

    // Way to await moment when all pie chart instance were rendered (needed for client side pdf generation)
    useEffect(() => {
        if (viewMode === 'pie' && onChartReady !== undefined) {
            chartReadyCounter === series.length && onChartReady()
        }
    }, [chartReadyCounter])

    const loadMore = useCallback(() => { setPieChartPage(pieChartPage + 1) }, [pieChartPage])

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
                // itemGap: 28,
                textStyle: {
                    fontSize: fontSizes.content,
                },
            },
            grid: {
                left: 0,
                right: 10,
                bottom: 0,
                // top: 0,
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
    const hasMore = pieChartPage * TICKET_CHART_PAGE_SIZE <= seriesRef.current.length
    let infiniteScrollContainerHeight = series.length > 2 ? '640px' : '340px'
    // onChartReadyCallback is used only for pdf generation page to make sure that chart component was rendered at DOM
    if (onChartReady !== undefined) {
        infiniteScrollContainerHeight = '100%'
    }

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
                <Typography.Paragraph style={{ marginTop: 60, paddingBottom: 0, height: infiniteScrollContainerHeight, overflow: 'auto' }}>
                    <InfiniteScroll
                        initialLoad={false}
                        loadMore={loadMore}
                        hasMore={hasMore}
                        useWindow={false}>
                        <List
                            grid={{ gutter: 24, xs: 1, sm: 1, md: 1, lg: 1, xl: 1, xxl: 2 }}
                            dataSource={series}
                            renderItem={(chartSeries, index) => (
                                <List.Item key={`pie-${index}`} style={{ width: 620 }} >
                                    <ReactECharts
                                        ref={element => chartRefs.current[index] = element}
                                        opts={{ ...chartOptions, renderer: 'svg', height: chartHeight }}
                                        onChartReady={() => setChartReadyCounter(chartReadyCounter + 1)}
                                        notMerge
                                        style={{ ...chartStyle, border: '1px solid', borderColor: colors.lightGrey[6], borderRadius: 8 }}
                                        option={{
                                            series: [chartSeries],
                                            title: {
                                                show: true,
                                                text: formatPieChartName(chartSeries.name),
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
                                </List.Item>
                            )}
                            style={{ paddingRight: 20, minWidth: 1080 }}
                        />
                    </InfiniteScroll>
                </Typography.Paragraph>
                {children}
            </>
        )}
    </Typography.Paragraph>
}

export default TicketChartView
