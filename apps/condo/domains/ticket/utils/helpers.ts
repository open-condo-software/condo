import get from 'lodash/get'
import groupBy from 'lodash/groupBy'
import dayjs, { Dayjs } from 'dayjs'
import { ParsedUrlQuery } from 'querystring'
import { SortOrder } from 'antd/es/table/interface'
import relativeTime from 'dayjs/plugin/relativeTime'
import duration from 'dayjs/plugin/duration'
import { EChartsOption, EChartsReactProps } from 'echarts-for-react'

import {
    Ticket,
    TicketAnalyticsGroupBy,
    TicketGroupedCounter,
    TicketStatus,
    TicketStatusWhereInput,
    TicketWhereInput,
} from '@app/condo/schema'

import { LOCALES } from '@condo/domains/common/constants/locale'
import { TICKET_REPORT_DAY_GROUP_STEPS } from '@condo/domains/ticket/constants/common'
import { fontSizes } from '@condo/domains/common/constants/style'
import { CLOSED_STATUS_TYPE, COMPLETED_STATUS_TYPE, CANCELED_STATUS_TYPE } from '@condo/domains/ticket/constants'

import {
    AnalyticsDataType,
    ChartConfigResult,
    TicketSelectTypes,
    ViewModeTypes,
} from '../components/TicketChart'
import { MAX_CHART_LEGEND_ELEMENTS, MAX_CHART_NAME_LENGTH } from '../constants/restrictions'
import { ITicketUIState } from './clientSchema/Ticket'
import { isEmpty } from 'lodash'

dayjs.extend(duration)
dayjs.extend(relativeTime)

export const getTicketCreateMessage = (intl, ticket) => {
    if (!ticket) {
        return
    }
    const dt = dayjs(ticket.createdAt)
    if (!dt.isValid()) return
    const formattedDate = intl.formatDate(dt.valueOf(), {
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
    return `${intl.formatMessage({ id: 'CreatedDate' })} ${formattedDate}`
}

export const getTicketTitleMessage = (intl, ticket) => {
    if (!ticket) {
        return
    }

    return `${intl.formatMessage({ id: 'pages.condo.ticket.id.PageTitle' })} № ${ticket.number}`
}

export const getTicketPdfName = (intl, ticket) => {
    return `${intl.formatMessage({ id: 'pages.condo.ticket.id.PageTitle' })}_${ticket.number}.pdf`
}

export const getTicketLabel = (intl, ticket) => {
    if (!ticket) {
        return
    }

    return get(ticket, ['status', 'name'])
}

export const sortStatusesByType = (statuses: Array<TicketStatus>) => {
    // status priority map [min -> max]
    const orderedStatusPriority = ['closed', 'deferred', 'canceled', 'completed', 'processing', 'new_or_reopened']

    return statuses.sort((leftStatus, rightStatus) => {
        const leftStatusWeight = orderedStatusPriority.indexOf(leftStatus.type)
        const rightStatusWeight = orderedStatusPriority.indexOf(rightStatus.type)

        if (leftStatusWeight < rightStatusWeight) {
            return 1
        } else if (leftStatusWeight > rightStatusWeight) {
            return -1
        }

        return 0
    })
}

export interface IFilters extends Pick<Ticket, 'clientName' | 'createdAt' | 'details' | 'number' | 'isEmergency'> {
    status?: Array<string>
    assignee?: string
    executor?: string
    property?: string
    search?: string
}

export const statusToQuery = (statusIds: Array<string>): TicketStatusWhereInput => {
    if (Array.isArray(statusIds) && statusIds.length > 0) {
        return {
            AND: [{
                id_in: statusIds,
            }],
        }
    }
}

export const createdAtToQuery = (createdAt?: string): Array<string> => {
    if (!createdAt) {
        return
    }

    const date = dayjs(createdAt)

    if (date.isValid()) {
        const min = date.startOf('day').toISOString()
        const max = date.endOf('day').toISOString()

        return [min, max]
    }
}

export const propertyToQuery = (address?: string) => {
    if (!address) {
        return
    }

    return {
        AND: [{
            address_contains_i: address,
        }],
    }
}

export const executorToQuery = (executor?: string) => {
    if (!executor) {
        return
    }

    return {
        AND: [{
            name_contains_i: executor,
        }],
    }
}

export const assigneeToQuery = (assignee?: string) => {
    if (!assignee) {
        return
    }

    return {
        AND: [{
            name_contains_i: assignee,
        }],
    }
}

export const statusToQueryByName = (statusName?: string) => {
    if (!statusName) {
        return
    }

    return {
        AND: [{ name_contains_i: statusName }],
    }
}


export const searchToQuery = (search?: string): TicketWhereInput[] => {
    if (!search) {
        return
    }

    const executorQuery = executorToQuery(search)
    const assigneeQuery = assigneeToQuery(search)
    const propertyQuery = propertyToQuery(search)
    const statusQuery = statusToQueryByName(search)

    return [
        { clientName_contains_i: search },
        { details_contains_i: search },
        { executor: executorQuery },
        { assignee: assigneeQuery },
        Number(search) && { number: Number(search) },
        { property: propertyQuery },
        { status: statusQuery },
    ].filter(Boolean)
}

export const filtersToQuery = (filters: IFilters): TicketWhereInput => {
    const statusIds = get(filters, 'status')
    const clientName = get(filters, 'clientName')
    const createdAt = get(filters, 'createdAt')
    const details = get(filters, 'details')
    const number = get(filters, 'number')
    const property = get(filters, 'property')
    const executor = get(filters, 'executor')
    const assignee = get(filters, 'assignee')
    const search = get(filters, 'search')
    const isEmergency = get(filters, 'isEmergency')

    const executorQuery = executorToQuery(executor)
    const assigneeQuery = assigneeToQuery(assignee)
    const statusFiltersQuery = statusToQuery(statusIds)
    const createdAtQuery = createdAtToQuery(createdAt)
    const propertyQuery = propertyToQuery(property)
    const searchQuery = searchToQuery(search)

    const filtersCollection = [
        statusFiltersQuery && { status: statusFiltersQuery },
        clientName && { clientName_contains_i: clientName },
        createdAtQuery && { createdAt_gte: createdAtQuery[0] },
        createdAtQuery && { createdAt_lte: createdAtQuery[1] },
        details && { details_contains_i: details },
        executor && { executor: executorQuery },
        assignee && { assignee: assigneeQuery },
        number && Number(number) && { number: Number(number) },
        property && { property: propertyQuery },
        isEmergency && { isEmergency: true },
        searchQuery && { OR: searchQuery },
    ].filter(Boolean)

    if (filtersCollection.length > 0) {
        return {
            AND: filtersCollection,
        }
    }
}

type SorterColumn = {
    columnKey: string,
    order: 'ascend' | 'descend'
}

export const sorterToQuery = (sorter?: SorterColumn | Array<SorterColumn>): Array<string> => {
    if (!sorter) {
        return []
    }

    if (!Array.isArray(sorter)) {
        sorter = [sorter]
    }

    return sorter.map((sort) => {
        const { columnKey, order } = sort

        const sortKeys = {
            'ascend': 'ASC',
            'descend': 'DESC',
        }

        const sortKey = sortKeys[order]

        if (!sortKey) {
            return
        }

        return `${columnKey}_${sortKeys[order]}`
    }).filter(Boolean)
}

const SORT_ORDERS = {
    'ASC': 'ascend',
    'DESC': 'descend',
}

const TICKET_TABLE_COLUMNS = [
    'number',
    'status',
    'details',
    'property',
    'assignee',
    'executor',
    'createdAt',
    'clientName',
]

export const queryToSorter = (query: Array<string>) => {
    return query.map((sort) => {
        const [columnKey, sortKey] = sort.split('_')

        try {
            if (TICKET_TABLE_COLUMNS.includes(columnKey) && SORT_ORDERS[sortKey]) {
                return {
                    columnKey,
                    order: SORT_ORDERS[sortKey],
                }
            }
        } catch (e) {
            // TODO(Dimitreee): send error to sentry
        }

        return
    }).filter(Boolean)
}

export const createSorterMap = (sortStringFromQuery: Array<string>): Record<string, SortOrder> => {
    if (!sortStringFromQuery) {
        return {}
    }

    return sortStringFromQuery.reduce((acc, column) => {
        const [columnKey, sortOrder] = column.split('_')

        const order = SORT_ORDERS[sortOrder]

        if (!order || !TICKET_TABLE_COLUMNS.includes(columnKey)) {
            return acc
        }

        acc[columnKey] = order

        return acc
    }, {})
}

export const getSortStringFromQuery = (query: ParsedUrlQuery): Array<string> => {
    const sort = get(query, 'sort', [])

    if (Array.isArray(sort)) {
        return sort
    }

    return sort.split(',')
}

export const TICKET_PAGE_SIZE = 10
const POSSIBLE_PAGE_SIZE = [10, 20, 50, 100]

export const getPageSizeFromQuery = (query: ParsedUrlQuery): number => {
    const queryValue = Number(get(query, 'pagesize', TICKET_PAGE_SIZE))
    if (POSSIBLE_PAGE_SIZE.indexOf(queryValue) !== -1) {
        return queryValue
    }
    const nearest = POSSIBLE_PAGE_SIZE
        .map(validPageSize => ({ validPageSize, difference: Math.abs(queryValue - validPageSize) }))
        .sort((a, b) => a.difference - b.difference)[0].validPageSize
    return nearest
}

export const getPageIndexFromQuery = (query: ParsedUrlQuery): number => {
    return Math.floor(Number(get(query, 'offset', 0)) / getPageSizeFromQuery(query)) + 1
}

/**
 * Formats raw timestamp string into human readable form, depending of what year it represents:
 * 1. For current year it returns day and month;
 * 2. For some previous year it returns day, month and year.
 * @param intl - i18n object from Next.js, containing `locale` prop
 * @param dateStr - raw timestamp string to format
 * @return {String} human readable representation of provided timestamp
 */
export const formatDate = (intl, dateStr?: string): string => {
    const currentDate = new Date()
    const date = new Date(dateStr)
    const pattern = date.getFullYear() === currentDate.getFullYear()
        ? 'D MMMM H:mm'
        : 'D MMMM YYYY H:mm'
    const locale = get(LOCALES, intl.locale)
    const localizedDate = locale ? dayjs(date).locale(locale) : dayjs(date)
    return localizedDate.format(pattern)
}

export type specificationTypes = 'day' | 'week' | 'month'
export type addressPickerType = { id: string; value: string; }
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
            filter: ticketAnalyticsPageFilters,
            viewMode: ViewModeTypes,
            ticketType: TicketSelectTypes,
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
            { isPaid: ticketType === 'paid' },
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
        legend: string[],
        viewMode: ViewModeTypes,
        animationEnabled: boolean,
        series: ChartConfigResult['series'],
        chartOptions: EChartsReactProps['opts'],
        color: string[],
        axisData?: ChartConfigResult['axisData'],
        tooltip?: ChartConfigResult['tooltip'],
        showTitle?: boolean
    }): {
        option: EChartsOption,
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
            left: 0,
            right: 0,
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

function getDeadlineStopPoint (ticket: ITicketUIState) {
    const ticketStatusType = get(ticket, ['status', 'type'])
    const ticketStatusUpdatedAt = get(ticket, ['statusUpdatedAt'])
    let deadlineStopPoint = dayjs().startOf('day')

    if (ticketStatusType === CLOSED_STATUS_TYPE || ticketStatusType === CANCELED_STATUS_TYPE) {
        deadlineStopPoint = dayjs(ticketStatusUpdatedAt)
    }

    return deadlineStopPoint
}

export enum TicketDeadlineType {
    MORE_THAN_DAY,
    LESS_THAN_DAY,
    OVERDUE,
}

/**
 * If more than 1 day is left before the deadline, then return the type MORE_THAN_DAY
 * If today is the deadline day or the deadline has passed, returns OVERDUE.
 * Otherwise returns LESS_THAN_DAY
 */
export function getDeadlineType (ticket: ITicketUIState): TicketDeadlineType {
    const deadline = dayjs(get(ticket, 'deadline'))
    const deadlineStopPoint = getDeadlineStopPoint(ticket)

    const deadlineStopPointNextDay = deadlineStopPoint.add(1, 'day')
    const isLessThanOneDay = deadline.isBefore(deadlineStopPointNextDay) || deadline.isSame(deadlineStopPointNextDay)

    if (isLessThanOneDay) {
        return (deadline.isBefore(deadlineStopPoint) || deadline.isSame(deadlineStopPoint)) ? TicketDeadlineType.OVERDUE : TicketDeadlineType.LESS_THAN_DAY
    }

    return TicketDeadlineType.MORE_THAN_DAY
}

export function getHumanizeDeadlineDateDifference (ticket: ITicketUIState) {
    const deadline = dayjs(get(ticket, 'deadline'))
    const deadlineStopPoint = getDeadlineStopPoint(ticket)

    const diff = deadline.diff(deadlineStopPoint, 'day')
    const overdueDiff = dayjs.duration(diff, 'days').subtract(1, 'day').humanize()
    const dayDiff = dayjs.duration(diff, 'days').humanize()

    if (diff === 1) {
        const dividedHumanizedDiff = dayDiff.split(' ')
        const oneDayDiff = `${diff} ${dividedHumanizedDiff[dividedHumanizedDiff.length - 1]}`
        return { dayDiff: oneDayDiff, overdueDiff }
    }

    return { dayDiff, overdueDiff }
}

/**
 * Checks that the time of the resident's last comment is later than the time the user read this comment
 * and later than the time someone replied to this comment
 * @param lastResidentCommentAt {string} Time of last resident comment
 * @param readResidentCommentByUserAt {string} Time when the resident's comments were last read by this user
 * @param lastCommentAt {string} Time of last comment
 */
export function hasUnreadResidentComments (lastResidentCommentAt, readResidentCommentByUserAt, lastCommentAt) {
    if (lastResidentCommentAt) {
        if (!readResidentCommentByUserAt) {
            if (lastCommentAt && dayjs(lastCommentAt).isSame(lastResidentCommentAt)) {
                return true
            }
        } else {
            if (dayjs(readResidentCommentByUserAt).isBefore(lastCommentAt)) {
                if (lastCommentAt && dayjs(lastCommentAt).isSame(lastResidentCommentAt)) {
                    return true
                }
            }
        }
    }

    return false
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
