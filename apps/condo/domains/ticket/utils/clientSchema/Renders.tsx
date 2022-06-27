import { Space, Typography } from 'antd'
import { FilterValue } from 'antd/es/table/interface'
import { TextProps } from 'antd/es/typography/Text'
import dayjs from 'dayjs'
import React, { CSSProperties } from 'react'
import get from 'lodash/get'
import xss from 'xss'

import { Tooltip } from '@condo/domains/common/components/Tooltip'
import { getHighlightedContents, getTableCellRenderer } from '@condo/domains/common/components/Table/Renders'
import { getAddressRender } from '@condo/domains/division/utils/clientSchema/Renders'
import { StyledTicketPropertyHintContent } from '@condo/domains/ticket/components/TicketPropertyHint/TicketPropertyHintContent'

import { TicketTag } from '../../components/TicketTag'
import { TICKET_TYPE_TAG_COLORS } from '../../constants/style'
import {
    getDeadlineType,
    getHumanizeDeadlineDateDifference,
    hasUnreadResidentComments,
    TicketDeadlineType,
} from '../helpers'
import { ITicketUIState } from './Ticket'

const NEW_COMMENTS_INDICATOR_TOOLTIP_WRAPPER_STYLES_ON_LARGER_THAN_XL: CSSProperties = { position: 'absolute', left: '-50px', top: '35%' }
const NEW_COMMENTS_INDICATOR_WRAPPER_STYLES: CSSProperties = { padding: '24px' }
const NEW_COMMENTS_INDICATOR_STYLES: CSSProperties = { backgroundColor: 'red', borderRadius: '100px', width: '8px', height: '8px' }

export const getTicketNumberRender = (intl, breakpoints, userTicketsCommentReadTime, ticketsCommentsTime, search: FilterValue) => {
    const LessThenDayMessage = intl.formatMessage({ id: 'ticket.deadline.LessThenDay' })
    const OverdueMessage = intl.formatMessage({ id: 'ticket.deadline.Overdue' })
    const NewResidentCommentMessage = intl.formatMessage({ id: 'ticket.newResidentComment' })

    return function render (number: string, ticket: ITicketUIState) {
        const deadline = dayjs(get(ticket, 'deadline'))
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

        const userTicketCommentRead = userTicketsCommentReadTime.find(obj => obj.ticket.id === ticket.id)
        const ticketCommentsTime = ticketsCommentsTime.find(obj => obj.ticket.id === ticket.id)

        const readResidentCommentByUserAt = get(userTicketCommentRead, 'readResidentCommentAt')
        const lastResidentCommentAt = get(ticketCommentsTime, 'lastResidentCommentAt')
        const lastCommentAt = get(ticketCommentsTime, 'lastCommentAt')

        const postfix = hasUnreadResidentComments(lastResidentCommentAt, readResidentCommentByUserAt, lastCommentAt) && (
            <div style={breakpoints.xl ? NEW_COMMENTS_INDICATOR_TOOLTIP_WRAPPER_STYLES_ON_LARGER_THAN_XL : {}}>
                <Tooltip title={NewResidentCommentMessage} placement={'topRight'}>
                    <Typography.Text title={NewResidentCommentMessage}>
                        <div style={NEW_COMMENTS_INDICATOR_WRAPPER_STYLES} >
                            <div style={NEW_COMMENTS_INDICATOR_STYLES} />
                        </div>
                    </Typography.Text>
                </Tooltip>
            </div>
        )

        return getTableCellRenderer(search, false, postfix, extraHighlighterProps, null, extraTitle)(number)
    }
}

const POSTFIX_PROPS: TextProps = { type: 'secondary', style: { whiteSpace: 'pre-line' } }

export const getUnitRender = (intl, search: FilterValue) => {
    const ShortSectionNameMessage = intl.formatMessage({ id: 'field.ShortSectionName' })
    const ShortFloorNameMessage = intl.formatMessage({ id: 'field.ShortFloorName' })

    return function render (text, record) {
        const sectionName = get(record, 'sectionName')
        const floorName = get(record, 'floorName')
        const unitType = get(record, 'unitType', 'flat')
        let unitNamePrefix = null
        let extraTitle = null
        const postfix = sectionName && floorName &&
            `\n${ShortSectionNameMessage} ${record.sectionName},\n${ShortFloorNameMessage} ${record.floorName}`
        if (text) {
            extraTitle = intl.formatMessage({ id: `pages.condo.ticket.field.unitType.${unitType}` })
            if (unitType !== 'flat') {
                unitNamePrefix = intl.formatMessage({ id: `pages.condo.ticket.field.unitType.prefix.${unitType}` })
            }
        }
        const unitName = text && unitNamePrefix ? `${unitNamePrefix} ${text}` : text
        return getTableCellRenderer(search, true, postfix, null, POSTFIX_PROPS, extraTitle)(unitName)
    }
}

export const getClassifierRender = (intl, search: FilterValue) => {
    return function render (text, record) {
        const placeClassifier = get(record, ['placeClassifier', 'name'])
        const postfix = `\n(${placeClassifier})`

        return getTableCellRenderer(search, false, postfix, null, POSTFIX_PROPS)(text)
    }
}

export const getTicketDetailsRender = (search: FilterValue) => {
    return function render (details: string, ticket: ITicketUIState) {
        const address = get(ticket, ['property', 'address'])
        const maxDetailsLength = address ? address.length : details.length
        const trimmedDetails = details.length > maxDetailsLength ? `${details.substring(0, maxDetailsLength)}…` : details

        return getTableCellRenderer(search, false, null, null, null, details)(trimmedDetails)
    }
}

export const getStatusRender = (intl, search: FilterValue) => {
    const EmergencyMessage = intl.formatMessage({ id: 'Emergency' })
    const WarrantyMessage = intl.formatMessage({ id: 'Warranty' })
    const ReturnedMessage = intl.formatMessage({ id: 'Returned' })
    const PaidMessage = intl.formatMessage({ id: 'Paid' })

    return function render (status, record) {
        const { primary: backgroundColor, secondary: color } = status.colors
        const extraProps = { style: { color } }
        // TODO(DOMA-1518) find solution for cases where no status received
        const highlightedContent = getHighlightedContents(search, null, extraProps)(status.name)

        return (
            <Space direction='vertical' size={7}>
                {
                    status.name && (
                        <TicketTag color={backgroundColor}>
                            {highlightedContent}
                        </TicketTag>
                    )
                }
                {
                    record.isEmergency && (
                        <TicketTag color={TICKET_TYPE_TAG_COLORS.emergency}>
                            <Typography.Text type="danger">
                                {EmergencyMessage}
                            </Typography.Text>
                        </TicketTag>
                    )
                }
                {
                    record.isPaid && (
                        <TicketTag color={TICKET_TYPE_TAG_COLORS.paid}>
                            {PaidMessage}
                        </TicketTag>
                    )
                }
                {
                    record.isWarranty && (
                        <TicketTag color={TICKET_TYPE_TAG_COLORS.warranty}>
                            {WarrantyMessage}
                        </TicketTag>
                    )
                }
                {
                    record.statusReopenedCounter > 0 && (
                        <TicketTag color={TICKET_TYPE_TAG_COLORS.returned}>
                            {ReturnedMessage} {record.statusReopenedCounter > 1 && `(${record.statusReopenedCounter})`}
                        </TicketTag>
                    )
                }
            </Space>
        )
    }
}

// This function is needed to shorten the ClientName so that the field in which it is located is not unnecessarily stretched
export const getTicketClientNameRender = (search: FilterValue) => {
    return function render (clientName: string, ticket: ITicketUIState) {
        const address = get(ticket, ['property', 'address'])
        const clientNameLength = get(clientName, 'length', 0)
        const maxClientNameLength = address ? address.length : clientNameLength
        const trimmedClientName = clientNameLength > maxClientNameLength ? `${clientName.substring(0, maxClientNameLength)}…` : clientName

        return getTableCellRenderer(search, false, null, null, null, clientName)(trimmedClientName)
    }
}

const HINT_STYLES: CSSProperties = { maxHeight: '6.5em', maxWidth: '300px', overflow: 'hidden', wordBreak: 'break-word', whiteSpace: 'inherit' }

export const getTicketPropertyHintRender = (search: FilterValue) => {
    return function render (value) {
        return (
            <StyledTicketPropertyHintContent
                dangerouslySetInnerHTML={{
                    __html: xss(value),
                }}
                style={HINT_STYLES}
            />
        )
    }
}

export const getTicketPropertyHintAddressesRender = (search: FilterValue) => {
    return function render (intl, properties) {
        const DeletedMessage = intl.formatMessage({ id: 'Deleted' })

        return properties.map((property) => getAddressRender(property, DeletedMessage, search))
    }
}