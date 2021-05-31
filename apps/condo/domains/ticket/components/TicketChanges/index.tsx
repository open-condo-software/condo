import React from 'react'
import { TicketChange as TicketChangeSchema } from '../../utils/clientSchema'
import { TicketChange } from './TicketChange'
import { Button, Col, Row, Typography } from 'antd'
import { useIntl } from '@core/next/intl'
// TODO(antonal): fix "Module not found: Can't resolve '@condo/schema'"
// import { SortTicketChangesBy } from '@condo/schema'


export const TicketChanges = ({ changes, fetchMore }) => {
    const intl = useIntl()
    const TicketChangesMessage = intl.formatMessage({ id: 'pages.condo.ticket.title.TicketChanges' })

    return (
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
                onClick={fetchMore}
            >
                Показать ещё
            </Button>
        </Col>
    )
}
