import React, { useRef, useEffect, useState, useCallback, useLayoutEffect } from 'react'
import { useIntl } from '@core/next/intl'
import { Skeleton, Typography, List } from 'antd'
import get from 'lodash/get'
import { BasicEmptyListView } from '@condo/domains/common/components/EmptyListView'
import ReactECharts from 'echarts-for-react'
import TicketChart, { EchartsSeries, ViewModeTypes } from '@condo/domains/ticket/components/TicketChart'
import { CHART_COLOR_SET } from '@condo/domains/common/constants/style'
import { TicketGroupedCounter } from '../../../../schema'
import { colors } from '@condo/domains/common/constants/style'
import InfiniteScroll from 'react-infinite-scroller'
import { TICKET_CHART_PAGE_SIZE } from '@condo/domains/ticket/constants/restrictions'
import { getChartOptions } from '@condo/domains/ticket/utils/helpers'
import styled from '@emotion/styled'

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

const ChartViewContainer = styled.div`
    & {
      position: relative;
    }
`

const ScrollContainer = styled.div<{ height: string }>`
  margin-top: 60px;
  padding-bottom: 0;
  overflow: auto;
  height: ${({ height }) => height};
`

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
    let legend = [], axisData = null, tooltip = null, color = CHART_COLOR_SET
    const [chartReadyCounter, setChartReadyCounter] = useState<number>(0)
    // Start from 1 because used as multiplier with TICKET_CHART_PAGE_SIZE
    const [pieChartPage, setPieChartPage] = useState(1)
    // Store pie chart refs because we need to access api for every chart component
    const chartRefs = useRef([])
    // Cache series result for client side paging
    const seriesRef = useRef<EchartsSeries[]>([])
    const seriesCacheRef = useRef<EchartsSeries[]>([])

    if (data !== null) {
        const mapperResult = mapperInstance.getChartConfig(viewMode, data)
        seriesCacheRef.current = mapperResult.series
        const pageSize = TICKET_CHART_PAGE_SIZE * pieChartPage
        seriesRef.current = mapperResult.series.slice(0, pageSize)
        // If component used as report widget, we should use page separation. Otherwise we load all data (for pdf page)
        legend = mapperResult.legend
        axisData = mapperResult.axisData
        tooltip = mapperResult.tooltip
        if (mapperResult.color) {
            color = mapperResult.color
        }
    }

    useEffect(() => {
        // Clean chart refs if input data was changed
        if (viewMode === 'pie') {
            if (seriesRef.current.length !== chartRefs.current.length) {
                // It means that filters were changed & total chart count may be changed too, so just reset refs & page
                setChartReadyCounter(0)
                setPieChartPage(1)
            }
            chartRefs.current = chartRefs.current.slice(0, seriesRef.current.length)
        }
    }, [data])

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
                    setPieChartPage(pieChartPage => pieChartPage + 1)
                    animationFrameId = requestAnimationFrame(nextAnimationFrame)
                }

                animationFrameId = requestAnimationFrame(nextAnimationFrame)
                return () => cancelAnimationFrame(animationFrameId)
            }
        }
    }, [chartReadyCounter])

    const loadMore = useCallback(() => { setPieChartPage(pieChartPage + 1) }, [pieChartPage])

    if (data === null || loading) {
        return <Skeleton loading={loading} active paragraph={{ rows: 12 }} />
    }
    const { animationEnabled, chartOptions } = chartConfig
    const isEmptyDataSet = data.every(ticketStatus => ticketStatus.count === 0)


    if (viewMode !== 'pie') {
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
        const chartHeight = get(chartOptions, 'height', false) || get(opts, 'height', 'auto')
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
                    {children}
                </>
            )}
        </ChartViewContainer>
    }

    const hasMore = pieChartPage * TICKET_CHART_PAGE_SIZE <= seriesRef.current.length
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
                        initialLoad={false}
                        loadMore={loadMore}
                        hasMore={hasMore}
                        useWindow={false}>
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
