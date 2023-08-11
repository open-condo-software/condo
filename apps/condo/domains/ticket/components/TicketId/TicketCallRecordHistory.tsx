import { SortCallRecordFragmentsBy } from '@app/condo/schema'
import { Col, Row, RowProps } from 'antd'
import React, { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import { CallRecordCard } from '@condo/domains/ticket/components/CallRecordCard'
import { useActiveCall } from '@condo/domains/ticket/contexts/ActiveCallContext'
import { CallRecordFragment } from '@condo/domains/ticket/utils/clientSchema'


interface ITicketCallRecordHistoryProps {
    ticketId: string
    ticketOrganizationId: string
}

const MAIN_ROW_GUTTER: RowProps['gutter'] = [0, 24]
const CALL_RECORDS_ROW_GUTTER: RowProps['gutter'] = [0, 16]

export const TicketCallRecordHistory: React.FC<ITicketCallRecordHistoryProps> = (props) => {
    const intl = useIntl()
    const TicketCallRecordHistoryTitle = intl.formatMessage({ id: 'pages.condo.ticket.title.CallRecordsHistory' })

    const { ticketId } = props

    const { isCallActive, connectedTickets } = useActiveCall()

    const { objs: ticketCalls } = CallRecordFragment.useObjects({
        where: { ticket: { id: ticketId } },
        sortBy: [SortCallRecordFragmentsBy.CreatedAtDesc],
    })

    const renderTicketCalls = useMemo(() => ticketCalls.map(
        ({ callRecord }) => (
            <Col span={24} key={callRecord.id}>
                <CallRecordCard callRecord={callRecord} />
            </Col>
        )
    ), [ticketCalls])

    const showAttachCallToTicketAlert = isCallActive && !connectedTickets.find(id => ticketId === id)
    
    if (ticketCalls.length === 0 && !showAttachCallToTicketAlert) {
        return null
    }

    return (
        <Col span={24}>
            <Row gutter={MAIN_ROW_GUTTER}>
                <Col span={24}>
                    <Typography.Title level={3}>{TicketCallRecordHistoryTitle}</Typography.Title>
                </Col>
                {
                    ticketCalls.length > 0 && (
                        <Col span={24}>
                            <Row gutter={CALL_RECORDS_ROW_GUTTER}>
                                {renderTicketCalls}
                            </Row>
                        </Col>
                    )
                }
            </Row>
        </Col>
    )
}