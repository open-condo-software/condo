import React from 'react'
import { Row, Col, Typography, Tooltip } from 'antd'
import { has } from 'lodash'
import styled from '@emotion/styled'
import { TicketChange as TicketChangeType } from '@app/condo/schema.d'
import { formatDate } from '../../utils/helpers'
import { useIntl } from '@core/next/intl'
import { PhoneLink } from '@condo/domains/common/components/PhoneLink'
import { green } from '@ant-design/colors'
import { MAX_DESCRIPTION_DISPLAY_LENGTH } from '@condo/domains/ticket/constants/restrictions'

interface ITicketChangeProps {
    ticketChange: TicketChangeType
}

interface ITicketChangeFieldMessages {
    add?: string,
    change: string,
    remove?: string,
}

interface ITicketChangeField {
    title: string,
    messages: ITicketChangeFieldMessages
}

export const TicketChange: React.FC<ITicketChangeProps> = ({ ticketChange }) => {
    const intl = useIntl()
    const changedFieldMessages = useChangedFieldMessagesOf(ticketChange)
    return (
        <Row gutter={[12, 12]}>
            <Col span={3}>
                <Typography.Text style={{ fontSize: '16px' }}>{formatDate(intl, ticketChange.createdAt)}</Typography.Text>
            </Col>
            <Col span={21}>
                {changedFieldMessages.map(({ field, message }) => (
                    <Typography.Text key={field} style={{ fontSize: '16px' }}>
                        <Diff className={field}>
                            {message}
                        </Diff>
                    </Typography.Text>
                ))}
            </Col>
        </Row>
    )
}

const useChangedFieldMessagesOf = (ticketChange) => {
    const intl = useIntl()
    const ClientPhoneChangeMessage = intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.clientPhone.change' })
    const ClientPhoneAddMessage = intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.clientPhone.add' })
    const ClientPhoneRemoveMessage = intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.clientPhone.remove' })
    const DetailsChangeMessage = intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.details.change' })
    const DetailsAddMessage = intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.details.add' })
    const DetailsRemoveMessage = intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.details.remove' })
    const ClientNameChangeMessage = intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.clientName.change' })
    const ClientNameAddMessage = intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.clientName.add' })
    const ClientNameRemoveMessage = intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.clientName.remove' })
    const IsPaidChangeMessage = intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.isPaid.change' })
    const IsPaidAddMessage = intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.isPaid.add' })
    const IsPaidRemoveMessage = intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.isPaid.remove' })
    const IsEmergencyChangeMessage = intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.isEmergency.change' })
    const IsEmergencyAddMessage = intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.isEmergency.add' })
    const IsEmergencyRemoveMessage = intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.isEmergency.remove' })
    const StatusDisplayNameChangeMessage = intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.statusDisplayName.change' })
    const StatusDisplayNameAddMessage = intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.statusDisplayName.add' })
    const StatusDisplayNameRemoveMessage = intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.statusDisplayName.remove' })
    const PropertyDisplayNameChangeMessage = intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.propertyDisplayName.change' })
    const PropertyDisplayNameAddMessage = intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.propertyDisplayName.add' })
    const PropertyDisplayNameRemoveMessage = intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.propertyDisplayName.remove' })
    const UnitNameChangeMessage = intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.unitName.change' })
    const UnitNameAddMessage = intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.unitName.add' })
    const UnitNameRemoveMessage = intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.unitName.remove' })
    const AssigneeChangeMessage = intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.assignee.change' })
    const AssigneeAddMessage = intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.assignee.add' })
    const AssigneeRemoveMessage = intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.assignee.remove' })
    const ClassifierChangeMessage = intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.classifier.change' })
    const ClassifierAddMessage = intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.classifier.add' })
    const ClassifierRemoveMessage = intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.classifier.remove' })

    const fields: ITicketChangeField[] = [
        {
            title: 'clientPhone',
            messages: {
                add: ClientPhoneAddMessage,
                change: ClientPhoneChangeMessage,
                remove: ClientPhoneRemoveMessage,
            },
        },
        {
            title: 'details',
            messages: {
                add: DetailsAddMessage,
                change: DetailsChangeMessage,
                remove: DetailsRemoveMessage,
            },
        },
        {
            title: 'clientName',
            messages: {
                add: ClientNameAddMessage,
                change: ClientNameChangeMessage,
                remove: ClientNameRemoveMessage,
            },
        },
        {
            title: 'isPaid',
            messages: {
                add: IsPaidAddMessage,
                change: IsPaidChangeMessage,
                remove: IsPaidRemoveMessage,
            },
        },
        {
            title: 'isEmergency',
            messages: {
                add: IsEmergencyAddMessage,
                change: IsEmergencyChangeMessage,
                remove: IsEmergencyRemoveMessage,
            },
        },
        {
            title: 'statusDisplayName',
            messages: {
                add: StatusDisplayNameAddMessage,
                change: StatusDisplayNameChangeMessage,
                remove: StatusDisplayNameRemoveMessage,
            },
        },
        {
            title: 'unitName',
            messages: {
                add: UnitNameAddMessage,
                change: UnitNameChangeMessage,
                remove: UnitNameRemoveMessage,
            },
        },
        {
            title: 'propertyDisplayName',
            messages: {
                add: PropertyDisplayNameAddMessage,
                change: PropertyDisplayNameChangeMessage,
                remove: PropertyDisplayNameRemoveMessage,
            },
        },
        {
            title: 'assigneeDisplayName',
            messages: {
                add: AssigneeAddMessage,
                change: AssigneeChangeMessage,
                remove: AssigneeRemoveMessage,
            },
        },
        {
            title: 'classifierDisplayName',
            messages: {
                add: ClassifierAddMessage,
                change: ClassifierChangeMessage,
                remove: ClassifierRemoveMessage,
            },
        },
    ]

    const BooleanToString = {
        isPaid: {
            'true': intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.isPaid.true' }),
            'false': intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.isPaid.false' }),
        },
        isEmergency: {
            'true': intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.isEmergency.true' }),
            'false': intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.isEmergency.false' }),
        },
    }

    const formatField = (field, value) => {
        const formatterFor = {
            clientPhone: (field, value) => (
                <PhoneLink value={value} />
            ),
            details: (field, value) => (
                value.length > MAX_DESCRIPTION_DISPLAY_LENGTH ? (
                    <Tooltip title={value}
                        placement="top"
                        overlayStyle={{
                            maxWidth: '80%',
                        }}>
                        {value.slice(0, MAX_DESCRIPTION_DISPLAY_LENGTH) + '…'}
                    </Tooltip>
                ) : value
            ),
        }
        return has(formatterFor, field)
            ? formatterFor[field](field, value)
            : value
    }

    const format = (field, value) => (
        typeof value === 'boolean'
            ? BooleanToString[field][value]
            : formatField(field, value)
    )

    /*
        Interpolates message string with JSX tags.
        They will be safely mounted in place of `{to}` and `{from}` placeholders
     */
    const formatDiffMessage = (field, message, ticketChange) => {
        // we have both "from" and "to" parts to interpolate
        if (message.search('{from}') !== -1 && message.search('{to}') !== -1) {
            const aroundFrom = message.split('{from}')
            const aroundTo = aroundFrom[1].split('{to}')
            const valueFrom = ticketChange[`${field}From`]
            const valueTo = ticketChange[`${field}To`]
            return (
                <>
                    <SafeUserMention createdBy={ticketChange.createdBy} />
                    &nbsp;{aroundFrom[0]}
                    <del>{format(field, valueFrom)}</del>
                    {aroundTo[0]}
                    <ins>{format(field, valueTo)}</ins>
                    {aroundTo[1]}
                </>
            )
        } else if (message.search('{to}') !== -1) { // only "to" part
            const aroundTo = message.split('{to}')
            const valueTo = ticketChange[`${field}To`]
            return (
                <>
                    <SafeUserMention createdBy={ticketChange.createdBy} />
                    &nbsp;{aroundTo[0]}
                    <ins>{format(field, valueTo)}</ins>
                    {aroundTo[1]}
                </>
            )
        } else if (message.search('{from}') !== -1) {
            const aroundFrom = message.split('{from}')
            const valueFrom = ticketChange[`${field}From`]
            return (
                <>
                    <SafeUserMention createdBy={ticketChange.createdBy} />
                    &nbsp;{aroundFrom[0]}
                    <ins>{format(field, valueFrom)}</ins>
                    {aroundFrom[1]}
                </>
            )
        }
    }

    // Omit what was not changed
    const changedFields = fields.filter(({ title }) => (
        ticketChange[`${title}From`] !== ticketChange[`${title}To`]
    ))

    const changedFieldsWithMessages = changedFields.map(({ title, messages }) => {
        if (!ticketChange[`${title}From`]) {
            return [title, messages.add]
        }
        else if (!ticketChange[`${title}To`]) {
            return [title, messages.remove]
        }
        else {
            return [title, messages.change]
        }
    })

    return changedFieldsWithMessages.map(([field, message]) => ({
        field,
        message: formatDiffMessage(field, message, ticketChange),
    }))
}

const SafeUserMention = ({ createdBy }) => {
    const intl = useIntl()
    const DeletedCreatedAtNoticeTitle = intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.notice.DeletedCreatedAt.title' })
    const DeletedCreatedAtNoticeDescription = intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.notice.DeletedCreatedAt.description' })
    return (
        createdBy ? (
            createdBy.name
        ) : (
            <Tooltip placement="top" title={DeletedCreatedAtNoticeDescription}>
                <span>{DeletedCreatedAtNoticeTitle}</span>
            </Tooltip>
        )
    )
}

const Diff = styled.p`
    &.statusDisplayName {
        del, ins {
            font-weight: bold;
            color: black;
        }
    }
    &.details, &.isEmergency, &.isPaid, &.classifierDisplayName {
        del, ins {
            color: black;
            span {
                color: black;
            }
        }
    }
    span, del, ins {
        &, a {
            color: ${green[6]};
        }
    }
    del, ins {
        text-decoration: none;
    }
    del, ins {
        span:hover {
            background: ${green[6]}
        }
    }
`