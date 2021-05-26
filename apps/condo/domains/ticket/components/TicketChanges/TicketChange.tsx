import React from 'react'
import { Row, Col } from 'antd'
import _ from 'lodash'
import styled from '@emotion/styled'
import { TicketChange as TicketChangeType } from '@app/condo/schema.d'
import { formatDate } from '../../../common/utils/helpers'
import { useIntl } from '@core/next/intl'
import { PhoneLink } from '../../../common/components/PhoneLink'

interface ITicketChangeProps {
    ticketChange: TicketChangeType
}

export const TicketChange: React.FC<ITicketChangeProps> = ({ ticketChange }) => {
    const intl = useIntl()
    return (
        <Row gutter={[12, 12]}>
            <Col span={3}>
                {formatDate(intl, ticketChange.createdAt)}
            </Col>
            <Col span={21}>
                <TicketChangeFields ticketChange={ticketChange}/>
            </Col>
        </Row>
    )
}

interface ITicketChangeFieldsProps {
    ticketChange: TicketChangeType
}

const TicketChangeFields: React.FC<ITicketChangeFieldsProps> = ({ ticketChange }) => {
    const intl = useIntl()
    const ClientPhoneMessage = intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.clientPhone' })
    const DetailsMessage = intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.details' })
    const ClientNameMessage = intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.clientName' })
    const IsPaidMessage = intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.isPaid' })
    const IsEmergencyMessage = intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.isEmergency' })
    const StatusDisplayNameMessage = intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.statusDisplayName' })
    const UnitNameMessage = intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.unitName' })
    const AssigneeMessage = intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.assignee' })
    const fields = [
        ['clientPhone', ClientPhoneMessage],
        ['details', DetailsMessage],
        ['clientName', ClientNameMessage],
        ['isPaid', IsPaidMessage],
        ['isEmergency', IsEmergencyMessage],
        ['statusDisplayName', StatusDisplayNameMessage],
        ['unitName', UnitNameMessage],
        ['assigneeDisplayName', AssigneeMessage],
    ]

    // Omit what was not changed
    const changedFields = fields.filter(([f]) => (
        ticketChange[`${f}From`] !== ticketChange[`${f}To`]
    ))

    const formatDiffMessage = (field, message, ticketChange) => {
        // value will be interleaved between splitted parts
        const parts1 = message.split('{from}')
        const parts2 =  parts1[1].split('{to}')
        const valueFrom = ticketChange[`${field}From`]
        const valueTo = ticketChange[`${field}To`]
        return [
            <span key={1}>{ticketChange.createdBy.name}</span>,
            ' ',
            parts1[0],
            <del key={3}>{format(field, valueFrom)}</del>,
            parts2[0],
            <ins key={2}>{format(field, valueTo)}</ins>,
            parts2[1],
        ]
    }

    const format = (field, value) => (
        typeof value === 'boolean'
            ? BooleanToString[field][value]
            : formatField(field, value)
    )

    const BooleanToString = {
        isPaid: {
            'true': intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.isPaid.true' }),
            'false': intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.isPaid.false' }),
        },
        isEmergency: {
            'true': intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.isPaid.true' }),
            'false': intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.isPaid.false' }),
        },
    }

    const formatField = (field, value) => {
        const formatterFor = {
            clientPhone: (field, value) => (
                <PhoneLink value={value}/>
            ),
            details: (field, value) => (
                value.length > 30 ? value.slice(0, 30) + '…' : value
            ),
        }
        return _.has(formatterFor, field)
            ? formatterFor[field](field, value)
            : value
    }

    return (
        <div>
            {changedFields.map(([field, message], i) => (
                <Diff key={i} className={field}>
                    {formatDiffMessage(field, message, ticketChange).map(part => (
                        part
                    ))}
                </Diff>
            ))}
        </div>
    )
}


const Diff = styled.p`
    &.statusDisplayName {
        del, ins {
            font-weight: bold;
            color: black;
        }
    }
    &.details {
        del, ins {
            color: black
        }
    }
    span, del, ins {
        color: #389E0D;
        a {
            color: #389E0D;
        }
    }
    del, ins {
        text-decoration: none;
    }
`