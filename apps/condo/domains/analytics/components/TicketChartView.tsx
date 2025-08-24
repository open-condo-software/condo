import { TicketGroupedCounter } from '@app/condo/schema'
import styled from '@emotion/styled'
import { Skeleton, Typography, List } from 'antd'
import get from 'lodash/get'
import dynamic from 'next/dynamic'
import React, { useRef, useEffect, useState, useCallback } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component'

import { ChevronDown } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'

import TicketChart, {
    ChartConfigResult,
    EchartsSeries,
    ViewModeTypes,
} from '@condo/domains/analytics/components/TicketChart'
import { TICKET_CHART_PAGE_SIZE } from '@condo/domains/analytics/utils/helpers'
import { getChartOptions, GroupTicketsByTypes } from '@condo/domains/analytics/utils/helpers'
import { Button } from '@condo/domains/common/components/Button'
import { BasicEmptyListView } from '@condo/domains/common/components/EmptyListView'
import { CHART_COLOR_SET } from '@condo/domains/common/constants/style'
import { colors } from '@condo/domains/common/constants/style'

import type { EChartsReactProps } from 'echarts-for-react'

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
        chartOptions?: EChartsReactProps['opts']
    }
    mainGroup?: GroupTicketsByTypes
}

const ReactECharts = dynamic(
    () => import('echarts-for-react').then((mod) => mod.default),
    { ssr: false, loading: () => null }
)

const ChartViewContainer = styled.div`
  position: relative;
`

const ScrollContainer = styled.div<{ height: string }>`
  margin-top: 60px;
  padding-bottom: 0;
  overflow: auto;
  height: ${({ height }) => height};
`

const EMPTY_CONTAINER_STYLE: React.CSSProperties = {
    height: '300px',
    display: 'flex',
    justifyContent: 'start',
    alignItems: 'start',
}

const TicketChartView: React.FC<React.PropsWithChildren<ITicketAnalyticsPageChartProps>> = (props) => {
    const {
        children,
        data,
        viewMode,
        loading = false,
        onChartReady,
        chartConfig,
        mapperInstance,
        mainGroup = 'status',
    } = props

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
    useEffect(() => {
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
    }, [chartReadyCounter, viewMode, onChartReady])

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
                    <div style={EMPTY_CONTAINER_STYLE}>
                        <Typography.Text>{NoData}</Typography.Text>
                    </div>
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
                        <Button style={{ width: '100%', marginTop: 16 }} type='ghost' onClick={loadMore}>
                            {LoadMoreTitle} <ChevronDown />
                        </Button>
                    ) : null}
                    {children}
                </>
            )}
        </ChartViewContainer>
    }

    const hasMore = chartPage * TICKET_CHART_PAGE_SIZE <= seriesRef.current.length
    let infiniteScrollContainerHeight = seriesRef.current.length > 2 ? '660px' : '340px'
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
                        hasMore={hasMore}
                        dataLength={seriesRef.current.length}
                        next={loadMore}
                        loader={null}
                    >
                        <List
                            grid={{ gutter: 24, xs: 1, sm: 1, md: 1, lg: 1, xl: 2, xxl: 2 }}
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
                                    <List.Item key={`pie-${index}`} style={{ width: 620 }}>
                                        <ReactECharts
                                            // @ts-ignore
                                            ref={element => chartRefs.current[index] = element}
                                            opts={opts}
                                            onChartReady={() => setChartReadyCounter(chartReadyCounter + 1)}
                                            notMerge
                                            style={{
                                                border: '1px solid',
                                                borderColor: colors.lightGrey[6],
                                                borderRadius: 8,
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
