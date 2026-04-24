import {
    TicketAnalyticsGroupBy,
    TicketGroupedCounter,
    TicketWhereInput,
} from '@app/condo/schema'
import dayjs, { Dayjs } from 'dayjs'
import duration from 'dayjs/plugin/duration'
import relativeTime from 'dayjs/plugin/relativeTime'
import get from 'lodash/get'
import groupBy from 'lodash/groupBy'
import isEmpty from 'lodash/isEmpty'

import { fontSizes } from '@condo/domains/common/constants/style'
import { TICKET_REPORT_DAY_GROUP_STEPS } from '@condo/domains/ticket/constants/common'

import {
    AnalyticsDataType,
    ChartConfigResult,
    TicketSelectTypes,
    ViewModeTypes,
} from '../components/TicketChart'

import type { EChartsOption, EChartsReactProps } from 'echarts-for-react'


dayjs.extend(duration)
dayjs.extend(relativeTime)

export const MAX_CHART_LEGEND_ELEMENTS = 2
export const MAX_CHART_NAME_LENGTH = 35
export const MAX_FILTERED_ELEMENTS = 20
export const MAX_TAG_TEXT_LENGTH = 30
export const TICKET_CHART_PAGE_SIZE = 6

export type specificationTypes = 'day' | 'week' | 'month'
export type addressPickerType = { id: string, value: string }
export type GroupTicketsByTypes = 'status' | 'property' | 'categoryClassifier' | 'executor' | 'assignee'

export type ticketAnalyticsPageFilters = {
    range: [Dayjs, Dayjs]
    specification: specificationTypes
    addressList: addressPickerType[]
    classifierList: addressPickerType[]
    executorList: addressPickerType[]
    responsibleList: addressPickerType[]
}

interface IFilterToQuery {
    (
        { filter, viewMode, ticketType, mainGroup }:
        {
            filter: ticketAnalyticsPageFilters
            viewMode: ViewModeTypes
            ticketType: TicketSelectTypes
            mainGroup: GroupTicketsByTypes
        }
    ): { AND: TicketWhereInput['AND'], groupBy: TicketAnalyticsGroupBy[] }
}

export const filterToQuery: IFilterToQuery = ({ filter, viewMode, ticketType, mainGroup }) => {
    const [dateFrom, dateTo] = filter.range
    let groupBy = []
    switch (mainGroup) {
        case 'status':
            groupBy = viewMode === 'line' ? [mainGroup, filter.specification] : ['property', mainGroup]
            break
        case 'property':
        case 'categoryClassifier':
        case 'assignee':
        case 'executor':
            groupBy = viewMode === 'bar' ? ['status', mainGroup] : [mainGroup, 'status']
            break
        default:
            throw new Error('unknown or not implemented filter')
    }

    const AND: TicketWhereInput['AND'] = [
        { createdAt_gte: dateFrom.startOf('day').toISOString() },
        { createdAt_lte: dateTo.endOf('day').toISOString() },
    ]

    if (filter.addressList.length) {
        AND.push({ property: { id_in: filter.addressList.map(({ id }) => id) } })
    }
    if (filter.classifierList.length) {
        AND.push({ categoryClassifier: { id_in: filter.classifierList.map(({ id }) => id) } })
    }
    if (filter.executorList.length) {
        AND.push({ executor: { id_in: filter.executorList.map(({ id }) => id) } })
    }
    if (filter.responsibleList.length) {
        AND.push({ assignee: { id_in: filter.responsibleList.map(({ id }) => id) } })
    }

    if (ticketType !== 'all') {
        AND.push(...[
            { isEmergency: ticketType === 'emergency' },
            { isWarranty: ticketType === 'warranty' },
            { isPayable: ticketType === 'payable' },
        ])
    }

    return { AND, groupBy }
}

interface IGetAggregatedData {
    (data: TicketGroupedCounter[], groupBy: TicketAnalyticsGroupBy[], injectSummaryInfo?: boolean): AnalyticsDataType
}

export const getAggregatedData: IGetAggregatedData = (data, groupByFilter, injectSummaryInfo = false) => {
    const [axisGroupKey] = groupByFilter
    const labelsGroupKey = TICKET_REPORT_DAY_GROUP_STEPS.includes(groupByFilter[1]) ? 'dayGroup' : groupByFilter[1]
    const groupedResult = groupBy(data, axisGroupKey)
    const result = {}
    injectSummaryInfo && Object.defineProperty(result, 'summary', { enumerable: false, writable: true, value: {} })

    Object.entries(groupedResult).forEach(([filter, dataObject]) => {
        const filterEntries = Object.entries(
            groupBy(dataObject, labelsGroupKey)
        ).map(([labelsGroupTitle, resultObject]) => [labelsGroupTitle, resultObject[0].count])

        injectSummaryInfo && filterEntries.forEach(([label, count]) => {
            if (label in result['summary']) {
                result['summary'][label] += count
            } else {
                result['summary'][label] = count
            }
        })
        result[filter] = Object.fromEntries(filterEntries)
    })
    return result
}

const formatPieChartName = (chartName: string): string => {
    return chartName.length > MAX_CHART_NAME_LENGTH
        ? `${chartName.substring(0, MAX_CHART_NAME_LENGTH)}...`
        : chartName
}

interface IGetChartOptions {
    ({
        legend,
        viewMode,
        animationEnabled,
        axisData,
        tooltip,
        series,
        chartOptions,
    }: {
        legend: string[]
        viewMode: ViewModeTypes
        animationEnabled: boolean
        series: ChartConfigResult['series']
        chartOptions: EChartsReactProps['opts']
        color: string[]
        axisData?: ChartConfigResult['axisData']
        tooltip?: ChartConfigResult['tooltip']
        showTitle?: boolean
    }): {
        option: EChartsOption
        opts: unknown
    }
}

export const getChartOptions: IGetChartOptions = ({
    series,
    axisData,
    tooltip,
    animationEnabled,
    viewMode,
    legend,
    chartOptions,
    color,
    showTitle = true }) => {
    const option = {
        animation: animationEnabled,
        color,
        grid: {
            left: '3%',
            right: '3%',
            bottom: 0,
            containLabel: true,
            borderWidth: 1,
        },
    }
    const opts = { ...chartOptions, renderer: 'svg' }
    const legendLayout = {
        x: 'left',
        top: 10,
        padding: [5, 135, 0, 0],
        icon: 'circle',
        itemWidth: 7,
        itemHeight: 7,
        textStyle: { fontSize: fontSizes.content },
        itemGap: 28,
        data: legend,
        type: animationEnabled ? 'scroll' : 'plain',
        pageButtonPosition: 'start',
    }

    const chartStyle = {}

    if (viewMode === 'pie') {
        option['legend'] = showTitle ? { data: legend, show: false } : legendLayout
        option['tooltip'] = { trigger: 'item', borderColor: '#fff' }

        option['series'] = series

        option['title'] = showTitle ? {
            show: true,
            text: formatPieChartName(series[0].name),
            left: 335,
            top: 30,
            textStyle: {
                fontSize: fontSizes.content,
                fontWeight: 700,
                overflow: 'breakAll',
                width: 160,
                lineHeight: 20,
            },
        } : { show: false }
    } else {
        option['legend'] = legendLayout
        option['xAxis'] = axisData['xAxis']
        option['yAxis'] = axisData['yAxis']
        option['series'] = series
        option['tooltip'] = tooltip
        const legendItemGap = 42
        option['grid']['top'] = animationEnabled
            ? 56
            : 30 + legend.length / MAX_CHART_LEGEND_ELEMENTS * legendItemGap

        const chartHeight = get(chartOptions, 'height', 'auto')
        opts['height'] = chartHeight

        if (chartHeight !== 'auto') {
            chartStyle['height'] = chartHeight
        }
        if (viewMode === 'bar' && chartHeight === 'auto') {
            const axisLabels = get(axisData, 'yAxis.data')
            if (axisLabels) {
                chartStyle['height'] = axisLabels.length * 65 + option['grid']['top']
                opts['height'] = chartStyle['height']
            }
        }

    }

    return { option, opts }
}

/** analyticsData array validation function.
 * The array can only be empty on the first render. Even if there are no tickets, mock objects are placed in analyticsData.
 * For the correct operation of the unload button in Excel, it is necessary to check the objects nested in the array for the presence of at least one ticket
 * @param {Object[]} analyticsData
  * @param {number} analyticsData[n].count - Number of tickets on this date.
 * @returns {boolean} - Returns true if there are no tickets in analyticsData and false if there is at least one
*/
export function isEmptyAnalyticsData (analyticsData) {
    if (isEmpty(analyticsData)) return true

    const count = analyticsData.reduce((count, date) => {
        return count + get(date, 'count', 0)
    }, 0)

    return count < 1
}
