import React, { useEffect, useState } from 'react'
import { TicketChange as TicketChangeSchema } from '../../utils/clientSchema'
import { TicketChange } from './TicketChange'
import { Col, Row, Typography, Button } from 'antd'
import { useIntl } from '@core/next/intl'
import { green } from '@ant-design/colors'
import { TicketChange as TicketChangeType } from '../../../../schema'
// TODO(antonal): fix "Module not found: Can't resolve '@condo/schema'"
// import { SortTicketChangesBy } from '@condo/schema'

interface ITicketChangesProps {
    items: TicketChangeType[],
}

const CHANGES_PER_CHUNK = 5

export const TicketChanges: React.FC<ITicketChangesProps> = ({ items }) => {
    const intl = useIntl()
    const TicketChangesMessage = intl.formatMessage({ id: 'pages.condo.ticket.title.TicketChanges' })

    return items.length > 0 && (
        <Col span={24} style={{ marginTop: '20px' }}>
            <Row gutter={[0, 24]}>
                <Col span={24}>
                    <Typography.Title level={5}>{TicketChangesMessage}</Typography.Title>
                </Col>
                <Col span={24}>
                    {items.map(change => (
                        <TicketChange
                            key={change.id}
                            ticketChange={change}
                        />
                    ))}

                </Col>
            </Row>
        </Col>
    )
}