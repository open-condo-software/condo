import { get, isEmpty, isNull } from 'lodash'
import dayjs  from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import duration from 'dayjs/plugin/duration'
import { ParsedUrlQuery } from 'querystring'
import { SortOrder } from 'antd/es/table/interface'
import { IntlShape } from '@formatjs/intl'

import {
    Ticket,
    TicketOrganizationSetting,
    TicketStatus,
    TicketStatusWhereInput,
    TicketWhereInput,
} from '@app/condo/schema'

import { LOCALES } from '@condo/domains/common/constants/locale'
import { CLOSED_STATUS_TYPE, CANCELED_STATUS_TYPE, DEFERRED_STATUS_TYPE } from '@condo/domains/ticket/constants'
import { DEFAULT_TICKET_DEADLINE_DURATION } from '@condo/domains/ticket/constants/common'

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

    const ticketStatus = get(ticket, ['status', 'type'])

    if (ticketStatus === DEFERRED_STATUS_TYPE) {
        const deferredUntil = dayjs(get(ticket, ['deferredUntil'])).format('DD.MM.YYYY')
        return `${intl.formatMessage({ id: 'ticket.status.DEFERRED.until.name' }, { deferredUntil })}`
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

function getDeadlineStopPoint (ticket: Ticket) {
    const ticketStatusType = get(ticket, ['status', 'type'])
    const ticketStatusUpdatedAt = get(ticket, ['statusUpdatedAt'])
    let deadlineStopPoint = dayjs().startOf('day')

    if (ticketStatusType === CLOSED_STATUS_TYPE || ticketStatusType === CANCELED_STATUS_TYPE) {
        deadlineStopPoint = dayjs(ticketStatusUpdatedAt).startOf('day')
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
export function getDeadlineType (ticket: Ticket): TicketDeadlineType {
    const deadline = dayjs(get(ticket, 'deadline'))
    const deadlineStopPoint = getDeadlineStopPoint(ticket)

    const deadlineStopPointNextDay = deadlineStopPoint.add(1, 'day')
    const isLessThanOneDay = deadline.isBefore(deadlineStopPointNextDay) || deadline.isSame(deadlineStopPointNextDay)

    if (isLessThanOneDay) {
        return (deadline.isBefore(deadlineStopPoint) || deadline.isSame(deadlineStopPoint)) ? TicketDeadlineType.OVERDUE : TicketDeadlineType.LESS_THAN_DAY
    }

    return TicketDeadlineType.MORE_THAN_DAY
}

export function getHumanizeDeadlineDateDifference (ticket: Ticket) {
    const deadline = dayjs(get(ticket, 'deadline'))
    const deadlineStopPoint = getDeadlineStopPoint(ticket)

    const diff = deadline.diff(deadlineStopPoint, 'day')
    const overdueDiff = dayjs.duration(diff, 'days').subtract(1, 'day').humanize()
    const dayDiff = dayjs.duration(diff, 'days').humanize()

    if (diff === 1) {  // case when diff equals 1 to make a string for ticket deadline of format 1 day (en) or 1 день (ru)
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

export function convertDurationToDays (duration: string): number {
    return dayjs.duration(duration).asDays()
}

export function convertDaysToDuration (days: number): string {
    return dayjs.duration({ days }).toISOString()
}

const DEFAULT_TICKET_DEADLINE_DURATION_AS_DAYS = dayjs.duration(DEFAULT_TICKET_DEADLINE_DURATION).asDays()

export function getTicketDefaultDeadline (ticketSetting: TicketOrganizationSetting, isPaid: boolean, isEmergency: boolean, isWarranty: boolean): number | null {
    if (!ticketSetting) return DEFAULT_TICKET_DEADLINE_DURATION_AS_DAYS

    let addDays: string | null = get(ticketSetting, 'defaultDeadlineDuration', null)
    if (isWarranty) addDays = get(ticketSetting, 'warrantyDeadlineDuration', null)
    if (isPaid) addDays = get(ticketSetting, 'paidDeadlineDuration', null)
    if (isEmergency) addDays = get(ticketSetting, 'emergencyDeadlineDuration', null)

    if (!isNull(addDays)) return convertDurationToDays(addDays)
    return addDays
}

export function isCompletedTicket (ticket: Ticket): boolean {
    const ticketStatusType = get(ticket, ['status', 'type'])
    return ticketStatusType === CLOSED_STATUS_TYPE || ticketStatusType === CANCELED_STATUS_TYPE
}

const getAddressDetails = (propertyAddressMeta) => {
    const addressMeta = get(propertyAddressMeta, 'data')

    const streetWithType = get(addressMeta, 'street_with_type')

    const houseType = get(addressMeta, 'house_type')
    const houseName = get(addressMeta, 'house')

    const blockType = get(addressMeta, 'block_type')
    const blockName = get(addressMeta, 'block')

    const regionType = get(addressMeta, 'region_type')
    const regionName = get(addressMeta, 'region')
    const regionWithType = get(addressMeta, 'region_with_type')
    const regionNamePosition = regionWithType && regionWithType.split(' ')[0] === regionName ? 0 : 1
    const regionWithFullType = regionNamePosition === 0 ? `${regionName} ${regionType}` : `${regionType} ${regionName}`

    const cityWithType = get(addressMeta, 'city_with_type')
    const cityName = get(addressMeta, 'city')

    const settlementPart = get(addressMeta, 'settlement_with_type')

    const block = blockType ? ` ${blockType} ${blockName}` : ''
    const settlement = streetWithType ? streetWithType : settlementPart
    const streetPart = settlement && `${settlement}, ${houseType} ${houseName}${block}`
    const regionPart = regionName && regionName !== cityName && regionWithFullType
    const cityPart = cityWithType && cityWithType

    const areaWithType = get(addressMeta, 'area_with_type')
    const areaPart = areaWithType && areaWithType !== cityPart && areaWithType

    const regionLine = regionPart ? `${regionPart}` : ''
    const areaLine = areaPart ? `${regionLine ? ',' : ''} ${areaPart}` : ''
    const cityLine = cityPart ? `${regionLine ? ',' : ''} ${cityPart}` : ''
    const settlementLine = settlementPart ? `, ${settlementPart}` : ''
    const renderData = regionLine + areaLine + settlementLine + cityLine + streetPart

    return { streetPart, areaPart, settlementPart, regionPart, cityPart, renderData }
}

const getUnitDetails = ({ ticket, intl }) => {
    const FloorMessage = intl.formatMessage({ id: 'ticketBlankExport.address.floor' })

    const unitName = ticket.unitName
    const unitType = ticket.unitType ?? 'flat'

    const sectionType = ticket.sectionType ?? 'section'
    const sectionName = ticket.sectionName

    const floorName = ticket.floorName

    const unitPart = unitName ? `${intl.formatMessage({ id: `ticketBlankExport.address.unitType.${unitType}` })} ${unitName}` : ''
    const sectionPart = sectionName ? `${intl.formatMessage({ id: `ticketBlankExport.address.sectionType.${sectionType}` })} ${sectionName}` : ''
    const floorPart = floorName ? `${FloorMessage} ${floorName}` : ''

    let sectionAndFloor = `${sectionPart}, ${floorPart}`
    if (!isEmpty(unitPart) && !isEmpty(sectionPart) && !isEmpty(floorPart)) {
        sectionAndFloor = `(${sectionAndFloor})`
    } else if (isEmpty(unitPart) && !isEmpty(sectionPart)) {
        if (isEmpty(floorPart)) {
            sectionAndFloor = sectionPart
        }
    } else {
        sectionAndFloor = ''
    }

    let renderData = ''
    if (unitPart) {
        renderData += ` ${unitPart}`
    }
    if (sectionAndFloor) {
        renderData += ` ${sectionAndFloor}`
    }

    return { renderData, unitPart, sectionPart, floorPart }
}

export const getFullAddressByTicket = ({ ticket, intl }: { ticket: Ticket, intl: IntlShape }) => {
    const {
        streetPart,
        areaPart,
        settlementPart,
        regionPart,
        cityPart,
        renderData: renderAddress,
    } = getAddressDetails(ticket.propertyAddressMeta)

    const { renderData: renderUnit, unitPart, sectionPart, floorPart } = getUnitDetails({ ticket, intl })

    let fullAddress = renderAddress
    if (renderUnit) {
        fullAddress += renderUnit
    }

    console.debug('getFullAddressByPropertyMeta', { ticket, streetPart, areaPart, settlementPart, regionPart, cityPart, renderAddress, unitPart, sectionPart, floorPart, renderUnit, fullAddress })
    return fullAddress
}
