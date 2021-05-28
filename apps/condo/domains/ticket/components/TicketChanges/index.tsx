import React from 'react'
import { TicketChange as TicketChangeSchema } from '../../utils/clientSchema'
import { TicketChange } from './TicketChange'
import { Button, Col, Row, Typography } from 'antd'
import { useIntl } from '@core/next/intl'
// TODO(antonal): fix "Module not found: Can't resolve '@condo/schema'"
// import { SortTicketChangesBy } from '@condo/schema'

interface ITicketChangesProps {
    ticketId: string
}

export const TicketChanges: React.FC<ITicketChangesProps> = ({ ticketId }) => {
    const intl = useIntl()
    const TicketChangesMessage = intl.formatMessage({ id: 'pages.condo.ticket.title.TicketChanges' })
    // TODO(antonal): get rid of separate GraphQL query for TicketChanges
    const { objs: changes, count: total, error, fetchMore } = TicketChangeSchema.useObjects({
        where: { ticket: { id: ticketId } },
        // TODO(antonal): fix "Module not found: Can't resolve '@condo/schema'"
        // sortBy: [SortTicketChangesBy.CreatedAtDesc],
        // @ts-ignore
        sortBy: ['createdAt_DESC'],
        first: 5,
    })
    console.log('rendering TicketChanges')
    return !error && changes && changes.length > 0 && (
        <Col span={24} style={{ marginTop: '20px' }}>
            <Row gutter={[0, 24]}>
                <Col span={24}>
                    <Typography.Title level={5}>{TicketChangesMessage}</Typography.Title>
                </Col>
                <Col span={24}>
                    {changes.map(change => (
                        <TicketChange
                            key={change.id}
                            ticketChange={change}
                        />
                    ))}
                </Col>
            </Row>
            <Button
                onClick={() => {
                    fetchMore({
                        where: { ticket: { id: ticketId } },
                        skip: 5,
                        first: 2,
                    })
                }}
            >
                Показать ещё
            </Button>
        </Col>
    )
}
