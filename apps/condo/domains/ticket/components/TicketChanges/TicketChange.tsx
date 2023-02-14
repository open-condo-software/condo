import { TicketChange as TicketChangeType } from '@app/condo/schema'
import styled from '@emotion/styled'
import { Row, Col, Typography } from 'antd'
import { BaseType } from 'antd/lib/typography/Base'
import dayjs from 'dayjs'
import { get, has, isEmpty, isNil, isNull } from 'lodash'
import Link from 'next/link'
import React  from 'react'

import { useIntl } from '@open-condo/next/intl'

import { SafeUserMention } from '@condo/domains/common/components/ChangeHistory/SafeUserMention'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { PhoneLink } from '@condo/domains/common/components/PhoneLink'
import { Tooltip } from '@condo/domains/common/components/Tooltip'
import { fontSizes } from '@condo/domains/common/constants/style'
import { REVIEW_VALUES } from '@condo/domains/ticket/constants'
import { MAX_DESCRIPTION_DISPLAY_LENGTH } from '@condo/domains/ticket/constants/restrictions'
import { STATUS_IDS } from '@condo/domains/ticket/constants/statusTransitions'
import { TICKET_TYPE_TAG_COLORS } from '@condo/domains/ticket/constants/style'
import { TicketStatus } from '@condo/domains/ticket/utils/clientSchema'
import { getReviewMessageByValue } from '@condo/domains/ticket/utils/clientSchema/Ticket'
import { RESIDENT } from '@condo/domains/user/constants/common'

interface ITicketChangeProps {
    ticketChange: TicketChangeType
}

interface ITicketChangeFieldMessages {
    add?: string,
    change?: string,
    remove?: string,
}

enum TicketChangeFieldMessageType {
    From,
    To,
}

const LINK_STYLE: React.CSSProperties = { color: 'inherit' }
const DETAILS_TOOLTIP_STYLE: React.CSSProperties = { maxWidth: '80%' }

export const TicketChange: React.FC<ITicketChangeProps> = ({ ticketChange }) => {
    const changedFieldMessages = useChangedFieldMessagesOf(ticketChange)
    const { isSmall } = useLayoutContext()

    const formattedDate = dayjs(ticketChange.createdAt).format('DD.MM.YYYY')
    const formattedTime = dayjs(ticketChange.createdAt).format('HH:mm')

    return (
        <Row gutter={[12, 12]}>
            <Col xs={24} lg={6}>
                <Typography.Text style={isSmall && { fontSize: fontSizes.content }} disabled={isSmall}>
                    {formattedDate}
                    <Typography.Text type='secondary'>, {formattedTime}</Typography.Text>
                </Typography.Text>
            </Col>
            <Col xs={24} lg={18}>
                {changedFieldMessages.map(({ field, message }) => (
                    <Typography.Text key={field} style={{ fontSize: fontSizes.content }}>
                        <Diff className={field}>
                            {message}
                        </Diff>
                    </Typography.Text>
                ))}
            </Col>
        </Row>
    )
}

const getAddressChangePostfix = (sectionName, sectionType, floorName, unitName, unitType, intl) => {
    const FloorMessage = intl.formatMessage({ id: 'field.floorName' }).toLowerCase()

    let addressChangePostfix = ''
    if (!isEmpty(sectionName)) {
        addressChangePostfix += `, ${intl.formatMessage({ id: `field.sectionType.${sectionType}` }).toLowerCase()} ${sectionName}`

        if (!isEmpty(floorName)) {
            addressChangePostfix += `, ${FloorMessage} ${floorName}`

            if (!isEmpty(unitName)) {
                addressChangePostfix += `, ${intl.formatMessage({ id: `field.UnitType.prefix.${unitType}` }).toLowerCase()}. ${unitName}`
            }
        }
    }

    return addressChangePostfix
}

const isDeclinedByResident = (ticketChange) =>
    get(ticketChange, 'createdBy.type') === RESIDENT
    && ticketChange['statusIdTo'] === STATUS_IDS.DECLINED

const isAutoReopenTicketChanges = (ticketChange) =>
    isNull(ticketChange.createdBy)
    && ticketChange['statusIdTo'] === STATUS_IDS.OPEN
    && ticketChange['statusIdFrom'] === STATUS_IDS.DEFERRED

const isAutoCloseTicketChanges = (ticketChange) =>
    isNull(ticketChange.createdBy)
    && ticketChange['statusIdTo'] === STATUS_IDS.CLOSED

type TicketType = 'emergency' | 'paid' | 'warranty'

const formatTicketFlag = (value, ticketType: TicketType) => {
    return (
        <Typography.Text>
            «<Typography.Text style={{ color: TICKET_TYPE_TAG_COLORS[ticketType] }}>{value}</Typography.Text>»
        </Typography.Text>
    )
}

/**
 * Adding link for ticket change field value
 *
 * @param ticketChange
 * @param fieldId
 * @param value
 * @param type
 * @param hrefTemplate template format `/contact/{id}`
 */
const addLink = (ticketChange, fieldId, value, type: TicketChangeFieldMessageType, hrefTemplate) => {
    const prefix = type === TicketChangeFieldMessageType.From ? 'From' : 'To'
    const id = ticketChange[`${fieldId}${prefix}`]

    if (!id) return value

    const href = hrefTemplate.replace('{id}', id)
    return (
        <Link href={href}>
            <Typography.Link href={href} style={LINK_STYLE} underline>
                {value}
            </Typography.Link>
        </Link>
    )
}

const useChangedFieldMessagesOf = (ticketChange) => {
    const intl = useIntl()
    const ClientPhoneMessage = intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.clientPhone' })
    const DetailsMessage = intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.details' })
    const ClientNameMessage = intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.clientName' })
    const StatusDisplayNameMessage = intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.statusDisplayName' })
    const AssigneeMessage = intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.assignee' })
    const ExecutorMessage = intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.executor' })
    const ClassifierMessage = intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.classifier' })
    const AddressMessage = intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.address' })
    const DeadlineMessage = intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.deadline' })
    const DeferredUntilMessage = intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.deferredUntil' })
    const SourceMessage = intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.source' })
    const CanReadByResidentMessage = intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.canReadByResident' })
    const DeclineTicketByResidentMessage = intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.declineTicketByResident.status' })

    const IsPaidMessage = intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.ticketType' })
    const IsEmergencyMessage = intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.ticketType' })
    const IsWarrantyMessage = intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.ticketType' })

    const FilledReviewCommentMessage = intl.formatMessage({ id: 'ticket.reviewComment.filled' })
    const BadReviewEmptyCommentMessage = intl.formatMessage({ id: 'ticket.reviewComment.empty.badReview' })
    const GoodReviewEmptyCommentMessage = intl.formatMessage({ id: 'ticket.reviewComment.empty.goodReview' })
    const AndMessage = intl.formatMessage(( { id: 'And' }))

    const { objs: ticketStatuses } = TicketStatus.useObjects({})

    const fields = [
        ['canReadByResident', CanReadByResidentMessage, { change: 'pages.condo.ticket.TicketChanges.canReadByResident.change' }],
        ['clientPhone', ClientPhoneMessage],
        ['details', DetailsMessage],
        ['clientName', ClientNameMessage],
        ['isPaid', IsPaidMessage],
        ['isEmergency', IsEmergencyMessage],
        ['isWarranty', IsWarrantyMessage],
        ['statusDisplayName', StatusDisplayNameMessage],
        ['propertyDisplayName', AddressMessage],
        ['assigneeDisplayName', AssigneeMessage, { add: 'pages.condo.ticket.TicketChanges.assignee.add' }],
        ['executorDisplayName', ExecutorMessage, { add: 'pages.condo.ticket.TicketChanges.executor.add', remove: 'pages.condo.ticket.TicketChanges.executor.remove' }],
        ['classifierDisplayName', ClassifierMessage],
        ['deadline', DeadlineMessage],
        ['deferredUntil', DeferredUntilMessage],
        ['statusReopenedCounter', '', { change: 'pages.condo.ticket.TicketChanges.statusReopenedCounter.change' }],
        ['reviewValue', '', { add: 'pages.condo.ticket.TicketChanges.reviewValue.add', change: 'pages.condo.ticket.TicketChanges.reviewValue.add' }],
        ['sourceDisplayName', SourceMessage],
    ]

    const BooleanToString = {
        canReadByResident: {
            'true': intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.canReadByResident.true' }),
            'false': intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.canReadByResident.false' }),
        },
        isPaid: {
            'true': intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.isPaid.true' }),
            'false': intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.isPaid.false' }),
        },
        isEmergency: {
            'true': intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.isEmergency.true' }),
            'false': intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.isEmergency.false' }),
        },
        isWarranty: {
            'true': intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.isWarranty.true' }),
            'false': intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.isWarranty.false' }),
        },
    }

    const formatField = (field, value, type: TicketChangeFieldMessageType) => {
        const formatterFor = {
            statusDisplayName: (field, value, type) => {
                const prefix = type ? 'To' : 'From'
                const statusId = get(ticketChange, `statusId${prefix}`)
                const ticketStatus = ticketStatuses.find(status => status.id === statusId)
                const ticketStatusColor = get(ticketStatus, ['colors', 'primary'])
                const ticketStatusChangeTextStyle = { color: ticketStatusColor }

                return (
                    <Typography.Text>
                        «<Typography.Text style={ticketStatusChangeTextStyle}>{value}</Typography.Text>»
                    </Typography.Text>
                )
            },
            deadline: (field, value) => {
                return <Typography.Text>{dayjs(value).format('DD MMMM YYYY')}</Typography.Text>
            },
            deferredUntil: (field, value) => {
                return <Typography.Text>{dayjs(value).format('DD MMMM YYYY')}</Typography.Text>
            },
            clientPhone: (field, value) => (
                <PhoneLink value={value} />
            ),
            details: (field, value) => {
                const formattedValue = value.length > MAX_DESCRIPTION_DISPLAY_LENGTH ? (
                    <Tooltip title={value}
                        placement='top'
                        overlayStyle={DETAILS_TOOLTIP_STYLE}
                    >
                        {value.slice(0, MAX_DESCRIPTION_DISPLAY_LENGTH) + '…'}
                    </Tooltip>
                ) : value
                return <Typography.Text>«{formattedValue}»</Typography.Text>
            },
            propertyDisplayName: (field, value, type: TicketChangeFieldMessageType) => {
                const unitNameFrom = ticketChange['unitNameFrom']
                const unitNameTo = ticketChange['unitNameTo']
                const sectionNameFrom = ticketChange['sectionNameFrom']
                const sectionNameTo = ticketChange['sectionNameTo']
                const floorNameFrom = ticketChange['floorNameFrom']
                const floorNameTo = ticketChange['floorNameTo']
                const sectionTypeFrom = ticketChange['sectionTypeFrom']
                const sectionTypeTo = ticketChange['sectionTypeTo']
                const unitTypeFrom = ticketChange['unitTypeFrom']
                const unitTypeTo = ticketChange['unitTypeTo']

                let addressChangePostfix = ''
                if (type === TicketChangeFieldMessageType.From) {
                    addressChangePostfix = getAddressChangePostfix(sectionNameFrom, sectionTypeFrom, floorNameFrom, unitNameFrom, unitTypeFrom, intl)
                }  else if (type === TicketChangeFieldMessageType.To) {
                    addressChangePostfix = getAddressChangePostfix(sectionNameTo, sectionTypeTo, floorNameTo, unitNameTo, unitTypeTo, intl)
                }

                return addLink(ticketChange, 'propertyId', !isEmpty(addressChangePostfix) ? `${value}${addressChangePostfix}` : value,  type,  '/property/{id}')
            },
            classifierDisplayName: (field, value) => {
                return <Typography.Text>«{value}»</Typography.Text>
            },
            reviewValue: (field, value) => {
                const textTypeByReview: { [key: string]: BaseType } = {
                    [REVIEW_VALUES.BAD]: 'warning',
                    [REVIEW_VALUES.GOOD]: 'success',
                }
                const reviewValueMessage = getReviewMessageByValue(value, intl)
                const reviewComment = ticketChange['reviewCommentTo']
                let reviewCommentMessage

                if (reviewComment) {
                    const selectedReviewOptions = reviewComment.split(';').map(option => `«${option.trim()}»`).join(` ${AndMessage} `)
                    reviewCommentMessage = `${FilledReviewCommentMessage} ${selectedReviewOptions}`
                } else {
                    if (value === REVIEW_VALUES.BAD) {
                        reviewCommentMessage = BadReviewEmptyCommentMessage
                    } else if (value === REVIEW_VALUES.GOOD) {
                        reviewCommentMessage = GoodReviewEmptyCommentMessage
                    }
                }

                return (
                    <Typography.Paragraph>
                        «<Typography.Text type={textTypeByReview[value]}>{reviewValueMessage}</Typography.Text>».&nbsp;
                        {reviewCommentMessage}
                    </Typography.Paragraph>
                )
            },
            sourceDisplayName: (field, value) => {
                return <Typography.Text>«{value}»</Typography.Text>
            },
            isEmergency: (field, value) => formatTicketFlag(value, 'emergency'),
            isPaid: (field, value) => formatTicketFlag(value, 'paid'),
            isWarranty: (field, value) => formatTicketFlag(value, 'warranty'),
            clientName: (field, value, type: TicketChangeFieldMessageType) => addLink(ticketChange, 'contactId', value,  type,  '/contact/{id}'),
        }

        return has(formatterFor, field)
            ? formatterFor[field](field, value, type)
            : <Typography.Text>{value}</Typography.Text>
    }

    const formatDiffMessage = (field, message, ticketChange, customMessages: ITicketChangeFieldMessages = {}) => {
        if (typeof ticketChange[`${field}To`] === 'boolean') {
            const valueTo = BooleanToString[field][ticketChange[`${field}To`]]
            const formattedValueTo = formatField(field, valueTo, TicketChangeFieldMessageType.To)
            const values = {
                field: message,
                to: formattedValueTo,
            }

            return (
                <>
                    <SafeUserMention changeValue={ticketChange}/>
                    &nbsp;
                    {intl.formatMessage({ id: customMessages.change || 'pages.condo.ticket.TicketChanges.boolean.change' }, values)}
                </>
            )
        }

        const valueFrom = ticketChange[`${field}From`]
        const valueTo = ticketChange[`${field}To`]
        const isValueFromNotEmpty = !isNil(valueFrom)
        const isValueToNotEmpty = !isNil(valueTo)
        const formattedValueFrom = formatField(field, valueFrom, TicketChangeFieldMessageType.From)
        const formattedValueTo = formatField(field, valueTo, TicketChangeFieldMessageType.To)
        const values = {
            field: message,
            from: formattedValueFrom,
            to: formattedValueTo,
        }

        if (isAutoCloseTicketChanges(ticketChange)) {
            return intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.autoCloseTicket' }, { status: formattedValueTo })
        }

        if (isValueFromNotEmpty && isValueToNotEmpty) {
            return (
                <>
                    <SafeUserMention changeValue={ticketChange}/>
                    &nbsp;
                    {intl.formatMessage({ id: customMessages.change || 'pages.condo.ticket.TicketChanges.change' }, values)}
                </>
            )
        } else if (isValueToNotEmpty) { // only "to" part
            return (
                <>
                    <SafeUserMention changeValue={ticketChange}/>
                    &nbsp;
                    {intl.formatMessage({ id: customMessages.add || 'pages.condo.ticket.TicketChanges.add' }, values)}
                </>
            )
        } else if (isValueFromNotEmpty) {
            return (
                <>
                    <SafeUserMention changeValue={ticketChange}/>
                    &nbsp;
                    {intl.formatMessage({ id: customMessages.remove || 'pages.condo.ticket.TicketChanges.remove' }, values)}
                </>
            )
        }
    }

    const formatAutoReopenDiffMessage = (field, ticketChange) => {
        const formatterFor = {
            deferredUntil: (field, ticketChange) => {
                const valueDeferredUntilFrom = formatField(field, ticketChange['deferredUntilFrom'], TicketChangeFieldMessageType.From)
                return intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.autoReopenTicket.deferredUntil' }, { deferredUntil: valueDeferredUntilFrom })
            },
            statusDisplayName: (field, ticketChange) => {
                const valueStatusTo = formatField(field, ticketChange['statusDisplayNameTo'], TicketChangeFieldMessageType.To)
                return intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.autoReopenTicket.status' }, { status: valueStatusTo })
            },
            assigneeDisplayName: (field, ticketChange) => {
                const valueAssigneeFrom = { name: ticketChange['assigneeDisplayNameFrom'], id: ticketChange['assigneeIdFrom'] }
                return intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.autoReopenTicket.resetAssignee' }, {
                    assignee: <Link href={`/employee/${valueAssigneeFrom.id}`}>{valueAssigneeFrom.name}</Link>,
                })
            },
            executorDisplayName: (field, ticketChange) => {
                const valueExecutorFrom = { name: ticketChange['executorDisplayNameFrom'], id: ticketChange['executorIdFrom'] }
                return intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.autoReopenTicket.resetExecutor' }, {
                    executor: <Link href={`/employee/${valueExecutorFrom.id}`}>{valueExecutorFrom.name}</Link>,
                })
            },
        }

        return formatterFor[field](field, ticketChange)
    }

    const getAutoReopenTicketChanges = (ticketChange) => {
        // need a specific order of fields for auto reopen tickets
        const fields = [
            ['deferredUntil'],
            ['assigneeDisplayName'],
            ['executorDisplayName'],
            ['statusDisplayName'],
        ]

        const changedFields = fields.filter(([field]) => (
            ticketChange[`${field}From`] !== null || ticketChange[`${field}To`] !== null
        ))

        return changedFields
            .map(([field]) => ({
                field,
                message: formatAutoReopenDiffMessage(field, ticketChange),
            }))
    }

    // Omit what was not changed
    let changedFields = fields.filter(([field]) => (
        ticketChange[`${field}From`] !== null || ticketChange[`${field}To`] !== null
    ))

    if (isAutoReopenTicketChanges(ticketChange)) {
        return getAutoReopenTicketChanges(ticketChange)
    }

    if (isDeclinedByResident(ticketChange)) {
        const fields = [
            ['statusDisplayName'],
        ]

        const changedFields = fields.filter(([field]) => (
            ticketChange[`${field}From`] !== null || ticketChange[`${field}To`] !== null
        ))

        return changedFields
            .map(([field]) => ({
                field,
                message: (
                    <>
                        <SafeUserMention changeValue={ticketChange}/>
                        &nbsp;
                        {DeclineTicketByResidentMessage}
                    </>
                ),
            }))
    }

    // If we have several changed fields in one changedField object and should display one message.
    // For example, when returning an ticket by a resident, only the message 'statusReopenedCounter' should be displayed,
    // and 3 fields are changed: 'statusReopenedCounter', 'statusDisplayName' and 'reviewValue'
    const priorityFields = ['statusReopenedCounter']
    const priorityField = priorityFields.find(priorityField => changedFields.find(([field]) => field === priorityField))
    if (priorityField) {
        changedFields = changedFields.filter(([changedField]) => changedField === priorityField)
    }

    return changedFields
        .map(([field, message, changeMessage]) => ({
            field,
            message: formatDiffMessage(field, message, ticketChange, changeMessage),
        }))
}

const Diff = styled.p`
    &.statusDisplayName {
        del, ins {
            font-weight: bold;
            color: black;
        }
    }
    &.details, &.isEmergency, &.isPaid, &.isWarranty, &.classifierDisplayName {
        del, ins {
            color: black;
            span {
                color: black;
            }
        }
    }
    del, ins {
        text-decoration: none;
    }
`
