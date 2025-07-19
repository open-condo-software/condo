import {
    TicketAnalyticsGroupBy as TicketGroupBy,
    TicketGroupedCounter, TicketQualityControlValueType,
} from '@app/condo/schema'
import dayjs from 'dayjs'
import get from 'lodash/get'

import { colors } from '@open-condo/ui/colors'

import TicketChart from '@condo/domains/analytics/components/TicketChart'
import { getAggregatedData } from '@condo/domains/analytics/utils/helpers'

const TOP_VALUES = 5
const COLOR_SET = [
    colors.pink['5'],
    colors.orange['5'],
    colors.green['5'],
    colors.brown['5'],
    colors.blue['5'],
    colors.teal['5'],
]
const DATE_FORMAT = 'DD.MM.YYYY'


type TicketChartCardProps = {
    data: Array<TicketGroupedCounter>
    loading?: boolean
    organizationId?: string
}

type TicketChartCardType = (props: TicketChartCardProps) => React.ReactElement

const AllTicketChartDataMapper = new TicketChart({
    line: {
        chart: (viewMode, data) => {
            const series = []

            const aggregatedData = getAggregatedData(data, [TicketGroupBy.Status, TicketGroupBy.Day])
            const axisLabels = Array
                .from(new Set(Object.values(aggregatedData).flatMap(e => Object.keys(e))))
                .sort((a, b) => dayjs(a, DATE_FORMAT).unix() - dayjs(b, DATE_FORMAT).unix())

            Object.entries(aggregatedData).forEach(([groupBy, dataObj], index) => {
                series.push({
                    name: groupBy,
                    type: viewMode,
                    symbol: 'none',
                    stack: 'total',
                    data: Object.entries(dataObj),
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
                    yAxis: { type: 'value', data: null, minInterval: 1 },
                },
                tooltip: { trigger: 'axis', axisPointer: { type: 'line' } },
                series,
                color: COLOR_SET,
            }
        },
        table: () => null,
    },
})

const TicketByCategoryDataMapper = new TicketChart({
    bar: {
        chart: (viewMode, data) => {
            const series = []

            const aggregatedData = getAggregatedData(data, [TicketGroupBy.Status, TicketGroupBy.CategoryClassifier], true)
            const axisLabels = Object.keys(aggregatedData.summary)
                .sort((firstLabel, secondLabel) => aggregatedData.summary[secondLabel] - aggregatedData.summary[firstLabel])
                .slice(0, TOP_VALUES)

            Object.entries(aggregatedData).forEach(([groupBy, dataObj]) => {
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

            const valueData = { type: 'value', data: null, boundaryGap: [0, 0.02], minInterval: 1 }
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
        table: (_, data, restTableOptions) => {
            const dataSource = []
            const aggregatedData = getAggregatedData(data, [TicketGroupBy.Status, TicketGroupBy.CategoryClassifier])
            const tableColumns = [
                {
                    key: restTableOptions.translations['categoryClassifier'],
                    title: restTableOptions.translations['categoryClassifier'],
                    dataIndex: TicketGroupBy.CategoryClassifier,
                },
                ...Object.entries(aggregatedData).map(([key]) => ({ title: key, dataIndex: key, key })),
            ]

            const dataSourceAggregation = getAggregatedData(data, [TicketGroupBy.CategoryClassifier, TicketGroupBy.Status])

            Object.entries(dataSourceAggregation).forEach(([categoryClassifier, obj], key) => {
                dataSource.push({ key, categoryClassifier, ...obj })
            })

            return {
                dataSource,
                tableColumns,
            }
        },
    },
})

const TicketHorizontalBarDataMapper = (groupBy: [TicketGroupBy, TicketGroupBy]): TicketChart => new TicketChart({
    bar: {
        chart: (viewMode, data) => {
            const series = []

            const aggregatedData = getAggregatedData(data, groupBy, true)
            const axisLabels = Object.keys(aggregatedData.summary)
                .sort((firstLabel, secondLabel) => aggregatedData.summary[secondLabel] - aggregatedData.summary[firstLabel])
                .slice(0, TOP_VALUES).reverse()

            Object.entries(aggregatedData).forEach(([groupBy, dataObj]) => {
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

            const axisData = {
                yAxis: {
                    type: 'category',
                    data: axisLabels,
                    zlevel: 2,
                    position: 'right',
                    axisLabel: {
                        show: true,
                        inside: true,
                        backgroundColor: 'white',
                        borderRadius: 12,
                        padding: 8,
                        opacity: 0.7,
                        color: 'black',
                    },
                    axisTick: { show: false },
                },
                xAxis: { type: 'value', data: null, minInterval: 1 },
            }
            const tooltip = { trigger: 'axis', axisPointer: { type: 'line' } }

            for (let i = 0; i < axisLabels.length; i++) {
                if (series.map(s => s.data[0]).every(e => e === 0 || e === undefined || e === null)) {
                    series.forEach(s => {
                        s.data.splice(0, 1)
                    })
                    axisLabels.splice(0, 1)
                }
            }

            return {
                series,
                legend: [],
                axisData,
                tooltip,
                color: COLOR_SET,
            }
        },
        table: (_, data, restTableOptions) => {
            const dataSource = []
            const dataSourceAggregation = getAggregatedData(data, [groupBy[1], groupBy[0]])
            const aggregatedData = getAggregatedData(data, groupBy)
            const tableColumns = [
                ...Object.entries(restTableOptions.translations as Record<string, string>).map(([dataIndex, key]) => ({
                    key: key as string,
                    title: key,
                    dataIndex,
                })),
                ...Object.entries(aggregatedData).map(([key]) => ({
                    key,
                    title: key,
                    dataIndex: key,
                })),
            ]

            Object.entries(dataSourceAggregation).forEach(([field, obj], key) => {
                dataSource.push({ key, [groupBy[1]]: field, ...obj })
            })

            return {
                dataSource,
                tableColumns,
            }
        },
    },
})

const TicketQualityControlDataMapper = new TicketChart({
    bar: {
        chart: (viewMode, [data, translations]) => {
            const series = []
            const goodKey = get(translations.find(t => t.value === TicketQualityControlValueType.Good), 'key')

            const aggregatedData = getAggregatedData(data, [TicketGroupBy.QualityControlValue, TicketGroupBy.Day])
            const axisLabels = Array
                .from(new Set(Object.values(aggregatedData).flatMap(e => Object.keys(e))))
                .sort((a, b) => dayjs(a, DATE_FORMAT).unix() - dayjs(b, DATE_FORMAT).unix())

            Object.entries(aggregatedData).forEach(([groupBy, dataObj]) => {
                const color = groupBy === goodKey ? colors.green['5'] : colors.red['5']
                series.push({
                    name: groupBy,
                    type: viewMode,
                    symbol: 'none',
                    data: Object.entries(dataObj),
                    smooth: true,
                    emphasis: { focus: 'series' },
                    color,
                })
            })

            return {
                legend: [],
                axisData: {
                    xAxis: { type: 'category', data: axisLabels },
                    yAxis: { type: 'value', data: null, minInterval: 1, boundaryGap: [0, 0.05] },
                },
                tooltip: { trigger: 'axis', axisPointer: { type: 'line' } },
                series,
            }
        },
        table: () => null,
    },
})

export {
    AllTicketChartDataMapper,
    TicketByCategoryDataMapper,
    TicketHorizontalBarDataMapper,
    TicketQualityControlDataMapper,
}
export type { TicketChartCardType }
