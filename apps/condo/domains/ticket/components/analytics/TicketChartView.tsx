import React, { useRef, useEffect, useState, useCallback, useLayoutEffect } from 'react'
import { useIntl } from '@core/next/intl'
import { Skeleton, Typography, List } from 'antd'
import get from 'lodash/get'
import { BasicEmptyListView } from '@condo/domains/common/components/EmptyListView'
import ReactECharts from 'echarts-for-react'
import TicketChart, {
    ChartConfigResult,
    EchartsSeries,
    ViewModeTypes,
} from '@condo/domains/ticket/components/TicketChart'
import { CHART_COLOR_SET } from '@condo/domains/common/constants/style'
import { TicketGroupedCounter } from '@app/condo/schema'
import { colors } from '@condo/domains/common/constants/style'
import InfiniteScroll from 'react-infinite-scroller'
import { TICKET_CHART_PAGE_SIZE } from '@condo/domains/ticket/constants/restrictions'
import { getChartOptions, GroupTicketsByTypes } from '@condo/domains/ticket/utils/helpers'
import styled from '@emotion/styled'
import { Button } from '@condo/domains/common/components/Button'
import { DownOutlined } from '@ant-design/icons'
import { useLayoutContext } from '../../../common/components/LayoutContext'

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
    mainGroup?: GroupTicketsByTypes
}

const ChartViewContainer = styled.div`
  position: relative;
`

const ScrollContainer = styled.div<{ height: string }>`
  margin-top: 60px;
  padding-bottom: 0;
  overflow: auto;
  height: ${({ height }) => height};
`

const TicketChartView: React.FC<ITicketAnalyticsPageChartProps> = (props) => {
    const {
        children,
        data,
        viewMode,
        loading = false,
        onChartReady,
        chartConfig,
        mapperInstance,
        mainGroup = 'ticket',
    } = props

    const { breakpoints } = useLayoutContext()

    const intl = useIntl()
    const NoData = intl.formatMessage({ id: 'NoData' })
    const LoadMoreTitle = intl.formatMessage(
        { id: 'pages.condo.analytics.TicketAnalyticsPage.TicketChartView.LoadMoreTitle' },
        { entity: intl.formatMessage({ id: `component.TicketWarningModal.Entity.${mainGroup}` }) }
    )

    let legend = [], tooltip = null, color = CHART_COLOR_SET
    const [chartReadyCounter, setChartReadyCounter] = useState<number>(0)
    // Start from 1 because used as multiplier with TICKET_CHART_PAGE_SIZE
    const [chartPage, setChartPage] = useState<number>(1)
    // Store pie chart refs because we need to access api for every chart component
    const chartRefs = useRef([])
    // Cache series result for client side paging
    const seriesRef = useRef<EchartsSeries[]>([])
    const seriesCacheRef = useRef<EchartsSeries[]>([])
    const axisDataRef = useRef<ChartConfigResult['axisData'] | null>(null)

    if (data !== null) {
        const mapperResult = mapperInstance.getChartConfig(viewMode, data)
        seriesCacheRef.current = mapperResult.series
        const pageSize = TICKET_CHART_PAGE_SIZE * chartPage
        seriesRef.current = mapperResult.series.slice(0, pageSize)
        // If component used as report widget, we should use page separation. Otherwise we load all data (for pdf page)
        legend = mapperResult.legend
        axisDataRef.current = mapperResult.axisData
        tooltip = mapperResult.tooltip
        if (mapperResult.color) {
            color = mapperResult.color
        }
    }

    useEffect(() => {
        setChartPage(1)
    }, [viewMode, mainGroup])

    useEffect(() => {
        // Clean chart refs if input data was changed
        if (viewMode === 'pie') {
            if (seriesRef.current.length !== chartRefs.current.length) {
                // It means that filters were changed & total chart count may be changed too, so just reset refs & page
                setChartReadyCounter(0)
                setChartPage(1)
            }
            chartRefs.current = chartRefs.current.slice(0, seriesRef.current.length)
        }
    }, [data, viewMode])

    // Way to await moment when all pie chart instance were rendered (needed for client side pdf generation)
    useLayoutEffect(() => {
        if (viewMode === 'pie' && onChartReady !== undefined) {
            if (seriesRef.current.length !== 0 && seriesCacheRef.current.length !== 0 && seriesRef.current.length === seriesCacheRef.current.length) {
                onChartReady()
                return
            }

            if (chartReadyCounter < seriesRef.current.length) {
                let animationFrameId
                const nextAnimationFrame = () => {
                    setChartPage(pieChartPage => pieChartPage + 1)
                    animationFrameId = requestAnimationFrame(nextAnimationFrame)
                }

                animationFrameId = requestAnimationFrame(nextAnimationFrame)
                return () => cancelAnimationFrame(animationFrameId)
            }
        }
    }, [chartReadyCounter])

    const loadMore = useCallback(() => { setChartPage(chartPage + 1) }, [chartPage])

    if (data === null || loading) {
        return <Skeleton loading={loading} active paragraph={{ rows: 12 }} />
    }
    const { animationEnabled, chartOptions } = chartConfig
    const isEmptyDataSet = data.every(ticketStatus => ticketStatus.count === 0)

    if (viewMode !== 'pie') {
        const pieChartDataStep = chartPage * TICKET_CHART_PAGE_SIZE
        const axisData = axisDataRef.current
        const hasMore = axisData !== null && pieChartDataStep < get(axisData, 'yAxis.data.length', 0)
        const barChartPagedRenderEnabled = animationEnabled && hasMore && viewMode === 'bar'

        if (barChartPagedRenderEnabled) {
            axisData['yAxis']['data'] = get(axisData, 'yAxis.data', []).slice(-pieChartDataStep)
            seriesCacheRef.current.forEach(series => {
                series.data = series.data.slice(-pieChartDataStep)
            })
        }
        const { opts, option } = getChartOptions({
            legend,
            axisData,
            tooltip,
            series: seriesCacheRef.current,
            chartOptions,
            viewMode,
            animationEnabled,
            color,
        })
        const chartHeight = get(opts, 'height', 'auto')
        const chartStyle = {
            height: chartHeight,
        }

        return <ChartViewContainer>
            {isEmptyDataSet ? (
                <>
                    <BasicEmptyListView>
                        <Typography.Text>{NoData}</Typography.Text>
                    </BasicEmptyListView>
                    {children}
                </>
            ) : (
                <>
                    <ReactECharts
                        opts={opts}
                        onChartReady={onChartReady}
                        notMerge
                        style={{ ...chartStyle }}
                        option={option}/>
                    {barChartPagedRenderEnabled ? (
                        <Button style={{ width: '100%', marginTop: 16 }} type={'ghost'} onClick={loadMore}>
                            {LoadMoreTitle} <DownOutlined />
                        </Button>
                    ) : null}
                    {children}
                </>
            )}
        </ChartViewContainer>
    }

    const hasMore = chartPage * TICKET_CHART_PAGE_SIZE <= seriesRef.current.length
    
    let infiniteScrollContainerHeight = '340px'
    if (breakpoints.md || breakpoints.xs || breakpoints.sm) {
        infiniteScrollContainerHeight = '520px'
    }
    if (breakpoints.lg) {
        infiniteScrollContainerHeight = '570px'
    }
    // onChartReadyCallback is used only for pdf generation page to make sure that chart component was rendered at DOM
    if (onChartReady !== undefined) {
        infiniteScrollContainerHeight = '100%'
    }

    return <ChartViewContainer>
        {isEmptyDataSet ? (
            <>
                <BasicEmptyListView>
                    <Typography.Text>{NoData}</Typography.Text>
                </BasicEmptyListView>
                {children}
            </>
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
                    option={
                        getChartOptions({
                            legend,
                            color,
                            series: [{ ...seriesRef.current[0], top: -1000, left: -1000, labelLayout: {}, label: { show: false } }],
                            viewMode: 'pie',
                            animationEnabled,
                            chartOptions: { renderer: 'svg' },
                            showTitle: false,
                        }).option
                    }
                    style={{ height: 40, overflow: 'hidden' }}
                />
                <ScrollContainer height={infiniteScrollContainerHeight}>
                    <InfiniteScroll
                        initialLoad={false}
                        loadMore={loadMore}
                        hasMore={hasMore}
                        useWindow={false}>
                        <List
                            grid={{ gutter: 24, xs: 1, sm: 2, md: 2, lg: 1, xl: 1, xxl: 2 }}
                            dataSource={seriesRef.current}
                            renderItem={(chartSeries, index) => {
                                const { option, opts } = getChartOptions({
                                    series: [chartSeries],
                                    legend,
                                    viewMode,
                                    chartOptions,
                                    animationEnabled,
                                    color,
                                })
                                return (
                                    <List.Item key={`pie-${index}`} style={{ width: breakpoints.lg ? '550' : '300', height:'100%' }}>
                                        <ReactECharts
                                            ref={element => chartRefs.current[index] = element}
                                            opts={opts}
                                            onChartReady={() => setChartReadyCounter(chartReadyCounter + 1)}
                                            notMerge
                                            style={{
                                                border: '1px solid',
                                                borderColor: colors.backgroundWhiteSecondary,
                                                borderRadius: 8,
                                                height: 'auto',
                                                width: 'auto',
                                            }}
                                            option={option}
                                        />
                                    </List.Item>
                                )
                            }}
                            style={{ paddingRight: 20, width: '100%' }}
                        />
                    </InfiniteScroll>
                </ScrollContainer>
                {children}
            </>
        )}
    </ChartViewContainer>
}

export default TicketChartView
