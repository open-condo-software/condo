import { useGetTicketCallRecordsFragmentsQuery } from '@app/condo/gql'
import { Col, Row, RowProps } from 'antd'
import React, { useMemo } from 'react'

import { useCachePersistor } from '@open-condo/apollo'
import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import { CallRecordCard } from '@condo/domains/ticket/components/CallRecordCard'
import { useActiveCall } from '@condo/domains/ticket/contexts/ActiveCallContext'


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

    const { persistor } = useCachePersistor()
    const { isCallActive, connectedTickets } = useActiveCall()

    const {
        data: ticketCallsData,
    } = useGetTicketCallRecordsFragmentsQuery({
        variables: { ticketId },
        skip: !persistor,
    })
    const ticketCalls = useMemo(() => ticketCallsData?.callRecordFragments?.filter(Boolean) || [],
        [ticketCallsData?.callRecordFragments])

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