import {
    GetTicketsQuery,
    GetUserTicketCommentsReadTimeQuery,
} from '@app/condo/gql'
import { MeterReportingPeriod, Ticket } from '@app/condo/schema'
import { Space, Typography } from 'antd'
import { FilterValue } from 'antd/es/table/interface'
import { TextProps } from 'antd/es/typography/Text'
import dayjs from 'dayjs'
import debounce from 'lodash/debounce'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import isString from 'lodash/isString'
import React, { CSSProperties, useCallback, useEffect, useRef, useState } from 'react'
import { IntlShape } from 'react-intl/src/types'

import { AlertCircle } from '@open-condo/icons'
import { Star, StarFilled } from '@open-condo/icons'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { colors } from '@open-condo/ui/colors'
import { ScreenMap } from '@open-condo/ui/dist/hooks'

import { getHighlightedContents, getTableCellRenderer } from '@condo/domains/common/components/Table/Renders'
import { Tooltip } from '@condo/domains/common/components/Tooltip'
import { analytics } from '@condo/domains/common/utils/analytics'
import { ObjectWithAddressInfo } from '@condo/domains/common/utils/helpers'
import { getPropertyAddressParts } from '@condo/domains/property/utils/helpers'
import { TicketTag } from '@condo/domains/ticket/components/TicketTag'
import { TICKET_TYPE_TAG_STYLE } from '@condo/domains/ticket/constants/style'
import { useFavoriteTickets } from '@condo/domains/ticket/contexts/FavoriteTicketsContext'

import {
    getDeadlineType,
    getHumanizeDeadlineDateDifference,
    hasUnreadOrganizationComments,
    hasUnreadResidentComments,
    TicketDeadlineType,
} from '../helpers'

import { UserFavoriteTicket } from './index'


const NEW_COMMENTS_INDICATOR_TOOLTIP_WRAPPER_STYLES_ON_LARGER_THAN_XL: CSSProperties = {
    position: 'absolute', left: '-102px', top: '50%', transform: 'translateY(-50%)', zIndex: 999,
}
const NEW_COMMENTS_INDICATOR_WRAPPER_STYLES_ON_SMALLER_THAN_XL: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px',
}
const NEW_COMMENTS_INDICATOR_WRAPPER_STYLES: CSSProperties = { padding: '24px' }
const NEW_COMMENTS_INDICATOR_STYLES = (color: string): CSSProperties => ({
    backgroundColor: color,
    borderRadius: '100px',
    width: '8px',
    height: '8px',
})
const ADDRESS_RENDER_POSTFIX_PROPS: TextProps = { type: 'secondary', style: { whiteSpace: 'pre-line' } }

export const getCommentsIndicatorRender = ({ intl, breakpoints, userTicketCommentReadTimes }: {
    intl: IntlShape
    breakpoints: ScreenMap
    userTicketCommentReadTimes: GetUserTicketCommentsReadTimeQuery['objs']
}) => {
    const NewResidentCommentMessage = intl.formatMessage({ id: 'ticket.newResidentComment' })
    const NewOrganizationCommentMessage = intl.formatMessage({ id: 'ticket.newOrganizationComment' })

    return function render (ticket: GetTicketsQuery['tickets'][0]) {
        const ticketId = ticket?.id
        const currentTicketUserTicketCommentReadTimes = ticketId ? userTicketCommentReadTimes.find(readTime => readTime?.ticket?.id === ticketId) : null

        const readLastCommentByUserAt = currentTicketUserTicketCommentReadTimes?.readCommentAt
        const readResidentCommentByUserAt = currentTicketUserTicketCommentReadTimes?.readResidentCommentAt
        const readOrganizationCommentByUserAt = currentTicketUserTicketCommentReadTimes?.readOrganizationCommentAt
        const lastResidentCommentAt = ticket?.lastResidentCommentAt
        const lastCommentWithResidentTypeAt = ticket?.lastCommentWithResidentTypeAt
        const lastCommentWithOrganizationTypeAt = ticket?.lastCommentWithOrganizationTypeAt
        const newResidentComment = hasUnreadResidentComments(lastResidentCommentAt, readResidentCommentByUserAt, lastCommentWithResidentTypeAt)
        const newOrganizationComment = hasUnreadOrganizationComments(readLastCommentByUserAt, lastCommentWithOrganizationTypeAt, readOrganizationCommentByUserAt)


        return (newResidentComment || newOrganizationComment) && (
            <div style={breakpoints.DESKTOP_LARGE ? NEW_COMMENTS_INDICATOR_TOOLTIP_WRAPPER_STYLES_ON_LARGER_THAN_XL : {}}>
                <Tooltip title={newResidentComment ? NewResidentCommentMessage : NewOrganizationCommentMessage} placement='topRight'>
                    <div style={breakpoints.DESKTOP_LARGE ? NEW_COMMENTS_INDICATOR_WRAPPER_STYLES : NEW_COMMENTS_INDICATOR_WRAPPER_STYLES_ON_SMALLER_THAN_XL}>
                        <div style={newResidentComment ? NEW_COMMENTS_INDICATOR_STYLES(colors.orange[5]) : NEW_COMMENTS_INDICATOR_STYLES(colors.blue[5])}/>
                    </div>
                </Tooltip>
            </div>
        )
    }
}

const DEBOUNCE_TIMEOUT_IN_MS = 200
const FAVORITE_TICKET_INDICATOR_CONTAINER_STYLE: CSSProperties = { cursor: 'pointer' }

export const FavoriteTicketIndicator = ({ ticketId }) => {
    const intl = useIntl()
    const AddToFavoriteMessage = intl.formatMessage({ id: 'pages.condo.ticket.favorite.addToFavorite' })
    const RemoveFromFavoriteMessage = intl.formatMessage({ id: 'pages.condo.ticket.favorite.removeFromFavorite' })

    const { user } = useAuth()
    const { userFavoriteTickets, refetchFavoriteTickets, loading } = useFavoriteTickets()

    const [isFavorite, setIsFavorite] = useState<boolean>()
    const [debouncedIsFavorite, setDebouncedIsFavorite] = useState<boolean>()

    const handleSetDebouncedIsFavorite = useRef(debounce((state) => {
        setDebouncedIsFavorite(state)
    }, DEBOUNCE_TIMEOUT_IN_MS))

    const initialIsFavorite = !!userFavoriteTickets.find(favoriteTicket => get(favoriteTicket, 'ticket.id') === ticketId)
    useEffect(() => {
        if (isFavorite === undefined && !loading) {
            setIsFavorite(initialIsFavorite)
        }
    }, [initialIsFavorite, isFavorite, loading])

    const createUserFavoriteTicketAction = UserFavoriteTicket.useCreate({
        user: { connect: { id: user.id } },
        ticket: { connect: { id: ticketId } },
    }, () => refetchFavoriteTickets())
    const deleteUserFavoriteTicketAction = UserFavoriteTicket.useSoftDelete(() => refetchFavoriteTickets())

    useEffect(() => {
        if (debouncedIsFavorite !== undefined && debouncedIsFavorite !== initialIsFavorite) {
            if (debouncedIsFavorite) {
                analytics.track('ticket_set_favourite_click', {})
                createUserFavoriteTicketAction({})
            } else {
                const favoriteTicket = userFavoriteTickets.find(favoriteTicket => get(favoriteTicket, 'ticket.id') === ticketId)
                deleteUserFavoriteTicketAction(favoriteTicket)
            }
        }
    }, [debouncedIsFavorite])

    const handleClick = useCallback((e) => {
        e.stopPropagation()

        setIsFavorite(prev => !prev)
        handleSetDebouncedIsFavorite.current(!isFavorite)
    }, [isFavorite])

    return (
        <Tooltip title={isFavorite ? RemoveFromFavoriteMessage : AddToFavoriteMessage} placement='bottomLeft'>
            <div style={FAVORITE_TICKET_INDICATOR_CONTAINER_STYLE} onClick={handleClick}>
                {
                    isFavorite ? (
                        <StarFilled size='medium' color={colors.yellow[5]}/>
                    ) : (
                        <Star size='medium' color={colors.gray[7]}/>
                    )
                }
            </div>
        </Tooltip>
    )
}

export const getTicketNumberRender = (intl, search: FilterValue) => {
    const LessThenDayMessage = intl.formatMessage({ id: 'ticket.deadline.LessThenDay' })
    const OverdueMessage = intl.formatMessage({ id: 'ticket.deadline.Overdue' })

    return function render (number: string, ticket: Ticket) {
        const deadline = dayjs(get(ticket, 'deadline'))
        const id = get(ticket, 'id')
        const href = `/ticket/${id}`
        let extraHighlighterProps
        let extraTitle = number

        if (deadline) {
            const deadlineType = getDeadlineType(ticket)

            switch (deadlineType) {
                case TicketDeadlineType.LESS_THAN_DAY: {
                    extraHighlighterProps = { type: 'warning' }
                    extraTitle = LessThenDayMessage

                    break
                }
                case TicketDeadlineType.OVERDUE: {
                    const { overdueDiff } = getHumanizeDeadlineDateDifference(ticket)

                    extraHighlighterProps = { type: 'danger' }
                    extraTitle = OverdueMessage.replace('{days}', overdueDiff)

                    break
                }
            }
        }

        return getTableCellRenderer({ search, extraHighlighterProps, extraTitle, href, underline: false })(number)
    }
}

const POSTFIX_PROPS: TextProps = { type: 'secondary', style: { whiteSpace: 'pre-line' } }

const getUnitPostfix = (unit, sectionNameMessage, floorNameMessage) => {
    let postfixMessage = unit ? '\n' : ''

    if (!isEmpty(sectionNameMessage) && !isEmpty(floorNameMessage)) {
        postfixMessage += `${sectionNameMessage},\n${floorNameMessage}`
    } else if (!isEmpty(sectionNameMessage)) {
        return `${sectionNameMessage}`
    }

    return postfixMessage
}

const getUnitMessage = (unit, unitNamePrefix, postfix) => {
    if (!isEmpty(unit)) {
        if (!isEmpty(unitNamePrefix)) {
            return `${unitNamePrefix} ${unit}`
        } else {
            return unit
        }
    } else if (!isEmpty(postfix)) {
        return '\n'
    }
}

const getUnitExtraTitle = (unit, unitType, sectionName, sectionType, floorName, intl): string => {
    const SectionTypeMessage = intl.formatMessage({ id: `field.sectionType.${sectionType}` })
    const UnitTypeMessage = intl.formatMessage({ id: `pages.condo.ticket.field.unitType.${unitType}` })
    const FloorMessage = intl.formatMessage({ id: 'field.floorName' })

    const sectionNameTitle = sectionName ? `${SectionTypeMessage} ${sectionName}` : ''
    const floorNameTitle = floorName ? `${FloorMessage} ${floorName}` : ''

    let result = ''
    if (!isEmpty(unit)) {
        result += `${UnitTypeMessage} ${unit}\n`
    }
    if (!isEmpty(sectionName)) {
        result += `${sectionNameTitle}`
        if (!isEmpty(floorNameTitle)) {
            result += `\n${floorNameTitle}`
        }
    }

    return result
}

export const getUnitRender = (intl, search: FilterValue) => {
    const ShortSectionNameMessage = intl.formatMessage({ id: 'field.ShortSectionName' })
    const ShortFloorNameMessage = intl.formatMessage({ id: 'field.ShortFloorName' })

    return function render (unit, ticket) {
        const sectionName = get(ticket, 'sectionName')
        const floorName = get(ticket, 'floorName')
        const unitType = get(ticket, 'unitType', 'flat') || 'flat'

        let unitNamePrefix = null
        const sectionNameMessage = sectionName ? `${ShortSectionNameMessage} ${ticket.sectionName}` : ''
        const sectionType = ticket.sectionType
        const floorNameMessage = floorName ? `${ShortFloorNameMessage} ${ticket.floorName}` : ''

        if (unit) {
            if (unitType !== 'flat') {
                unitNamePrefix = intl.formatMessage({ id: `pages.condo.ticket.field.unitType.prefix.${unitType}` })
            }
        }

        const postfix = getUnitPostfix(unit, sectionNameMessage, floorNameMessage)
        const extraTitle = getUnitExtraTitle(unit, unitType, sectionName, sectionType, floorName, intl)
        const unitName = getUnitMessage(unit, unitNamePrefix, postfix)

        return getTableCellRenderer({ search, ellipsis: true, postfix, extraPostfixProps: POSTFIX_PROPS, extraTitle })(unitName)
    }
}

export const getClassifierRender = (intl, search?: FilterValue) => {
    return function render (text, record) {
        const placeClassifier = get(record, ['classifier', 'place', 'name'])
        const postfix = `\n(${placeClassifier})`

        return getTableCellRenderer({ search, ellipsis: true, postfix, extraPostfixProps: POSTFIX_PROPS })(text)
    }
}

export const getTicketDetailsRender = (search?: FilterValue) => {
    return function render (details: string, ticket: Ticket) {
        const address = get(ticket, ['property', 'address'])
        const maxDetailsLength = address ? address.length : details.length
        const trimmedDetails = details.length > maxDetailsLength ? `${details.substring(0, maxDetailsLength)}…` : details

        return getTableCellRenderer({ search, extraTitle: details })(trimmedDetails)
    }
}

export const getStatusRender = (intl, search?: FilterValue, isSupervisedTicketSource?: (record) => boolean) => {
    const EmergencyMessage = intl.formatMessage({ id: 'Emergency' })
    const WarrantyMessage = intl.formatMessage({ id: 'Warranty' })
    const ReturnedMessage = intl.formatMessage({ id: 'Returned' })
    const PayableMessage = intl.formatMessage({ id: 'Payable' })
    const SupervisedTicketMessage = intl.formatMessage({ id: 'ticket.tags.supervised' })
    const EscalatedTicketMessage = intl.formatMessage({ id: 'ticket.tags.escalated' })

    return function render (status, record) {
        const { primary: backgroundColor, secondary: color } = status.colors
        const extraProps = { style: { color } }
        // TODO(DOMA-1518) find solution for cases where no status received
        const highlightedContent = getHighlightedContents({ search, extraProps })(status.name)

        const isSupervised = isSupervisedTicketSource ? isSupervisedTicketSource(record?.source?.id) : false

        return (
            <Space direction='vertical' size={7}>
                {
                    status.name && (
                        <TicketTag color={backgroundColor} style={{ fontSize: '12px', fontWeight: 600 }}>
                            {highlightedContent}
                        </TicketTag>
                    )
                }
                {
                    record.isEmergency && (
                        <TicketTag style={TICKET_TYPE_TAG_STYLE.emergency}>
                            <Typography.Text type='danger'>
                                {EmergencyMessage}
                            </Typography.Text>
                        </TicketTag>
                    )
                }
                {
                    record.isPayable && (
                        <TicketTag style={TICKET_TYPE_TAG_STYLE.payable}>
                            {PayableMessage}
                        </TicketTag>
                    )
                }
                {
                    record.isWarranty && (
                        <TicketTag style={TICKET_TYPE_TAG_STYLE.warranty}>
                            {WarrantyMessage}
                        </TicketTag>
                    )
                }
                {
                    record.statusReopenedCounter > 0 && (
                        <TicketTag style={TICKET_TYPE_TAG_STYLE.returned}>
                            {ReturnedMessage} {record.statusReopenedCounter > 1 && `(${record.statusReopenedCounter})`}
                        </TicketTag>
                    )
                }
                {
                    isSupervised && !record?.sentToAuthoritiesAt && (
                        <TicketTag style={TICKET_TYPE_TAG_STYLE.supervised}>
                            {SupervisedTicketMessage}
                        </TicketTag>
                    )
                }
                {
                    isSupervised && record?.sentToAuthoritiesAt && (
                        <TicketTag style={{ ...TICKET_TYPE_TAG_STYLE.escalated, display: 'inline-flex' }}>
                            <Space align='center' direction='horizontal' size={4}>
                                <div style={{ display: 'flex' }}>
                                    <AlertCircle size='small' />
                                </div>
                                {EscalatedTicketMessage}
                            </Space>
                        </TicketTag>
                    )
                }
            </Space>
        )
    }
}

export const getTicketUserNameRender = (search: FilterValue) => {
    return function render (clientName, ticket: Ticket) {
        const contact = get(ticket, 'contact')
        const name = contact ? get(contact, 'name') : get(ticket, 'clientName')
        const address = get(ticket, ['property', 'address'])
        const userNameLength = get(name, 'length', 0)
        const maxUserNameLength = address ? address.length : userNameLength
        const trimmedUserName = userNameLength > maxUserNameLength ? `${name.substring(0, maxUserNameLength)}…` : name

        return getTableCellRenderer({ search, extraTitle: name })(trimmedUserName)
    }
}

export const getMeterReportingPeriodRender = (search: FilterValue, intl) => {

    return function render (periodRecord: MeterReportingPeriod) {
        const startAt = get(periodRecord, 'notifyStartDay')
        const finishAt = get(periodRecord, 'notifyEndDay')
        const ReportingPeriodMessage = intl.formatMessage({ id: 'pages.condo.meter.index.reportingPeriod.Table.reportingPeriod' }, { startAt, finishAt })
        return getTableCellRenderer({ search })(ReportingPeriodMessage)
    }
}

export const getAddressRender = (property: ObjectWithAddressInfo, unitNameMessage?: string, DeletedMessage?: string, ellipsis?: boolean) => {
    const { postfix, text } = getPropertyAddressParts(property, DeletedMessage)
    let renderText = ''
    if (text) {
        renderText += text
        if (unitNameMessage) {
            renderText += unitNameMessage
        }
    }
    const title = `${text} ${isString(postfix) && postfix || ''}`

    const getPostfix = () => (
        <Typography.Text {...ADDRESS_RENDER_POSTFIX_PROPS} ellipsis={ellipsis}>
            {postfix}
        </Typography.Text>
    )

    return (
        <Typography.Text title={title} ellipsis={ellipsis}>
            {renderText} {postfix && getPostfix()}
        </Typography.Text>
    )
}