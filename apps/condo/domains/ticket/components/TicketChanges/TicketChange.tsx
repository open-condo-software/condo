import React from 'react'
import { Row, Col } from 'antd'
import styled from '@emotion/styled'
import { TicketChange as TicketChangeType } from '@app/condo/schema.d'
import { formatDate } from '../../../common/utils/helpers'
import { useIntl } from '@core/next/intl'

interface ITicketChangeProps {
    ticketChange: TicketChangeType
}

export const TicketChange: React.FC<ITicketChangeProps> = ({ ticketChange }) => (
    <Row gutter={[12, 12]}>
        <Col span={3}>
            {formatDate(ticketChange.createdAt)}
        </Col>
        <Col span={21}>
            <TicketChangeFields ticketChange={ticketChange}/>
        </Col>
    </Row>
)

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
        ['unitNameFrom', UnitNameMessage],
        ['assigneeDisplayName', AssigneeMessage],
    ]

    const changedFields = fields.filter(([f]) => (
        ticketChange[`${f}From`] !== ticketChange[`${f}To`]
    ))

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

    const formatDiffMessage = (field, message, ticketChange) => {
        const parts1 = message.split('{from}')
        const parts2 =  parts1[1].split('{to}')
        const valueFrom = ticketChange[`${field}From`]
        const valueTo = ticketChange[`${field}To`]
        return [
            <span key={1}>{ticketChange.createdBy.name}</span>,
            ' ',
            parts1[0],
            <del key={3}>{stringify(field, valueFrom)}</del>,
            parts2[0],
            <ins key={2}>{stringify(field, valueTo)}</ins>,
            parts2[1],
        ]
    }

    const stringify = (field, value) => (
        typeof value === 'boolean'
            ? BooleanToString[field][value]
            : value
    )

    return (
        <div>
            {changedFields.map(([field, message], i) => (
                <Diff key={i}>
                    {formatDiffMessage(field, message, ticketChange).map(part => (
                        part
                    ))}
                </Diff>
            ))}
        </div>
    )
}


const Diff = styled.p`
    span, del, ins {
        color: #389E0D;
    }
    del, ins {
        text-decoration: none;
    }
`