import React, { useState } from 'react'
import { TicketChange } from './TicketChange'
import { Col, Row, Typography, Button } from 'antd'
import { useIntl } from '@core/next/intl'
import { green } from '@ant-design/colors'
import { TicketChange as TicketChangeType } from '../../../../schema'
// TODO(antonal): fix "Module not found: Can't resolve '@condo/schema'"
// import { SortTicketChangesBy } from '@condo/schema'
import { FormattedMessage } from 'react-intl'

interface ITicketChangesProps {
    items: TicketChangeType[],
    total: number,
}

const CHANGES_PER_CHUNK = 5

export const TicketChanges: React.FC<ITicketChangesProps> = ({ items, total }) => {
    const intl = useIntl()
    const [displayCount, setDisplayCount] = useState(CHANGES_PER_CHUNK)
    const TicketChangesMessage = intl.formatMessage({ id: 'pages.condo.ticket.title.TicketChanges' })

    return items.length > 0 && (
        <Col span={24} style={{ marginTop: '20px' }}>
            <Row gutter={[0, 24]}>
                <Col span={24}>
                    <Typography.Title level={5}>{TicketChangesMessage}</Typography.Title>
                </Col>
                <Col span={24}>
                    {items.slice(0, displayCount).map(change => (
                        <TicketChange
                            key={change.id}
                            ticketChange={change}
                        />
                    ))}
                    {displayCount < total && (
                        <Button
                            type="text"
                            onClick={() => {
                                setDisplayCount(displayCount + CHANGES_PER_CHUNK)
                            }}
                            style={{
                                fontSize: '16px',
                                padding: 0,
                                color: green[6],
                            }}
                        >
                            ↓&nbsp;
                            <FormattedMessage
                                id="pages.condo.ticket.TicketChanges.fetchMore"
                                values={{
                                    count: Math.min(total - displayCount, CHANGES_PER_CHUNK),
                                }}
                            />
                        </Button>
                    )}
                </Col>
            </Row>
        </Col>
    )
}