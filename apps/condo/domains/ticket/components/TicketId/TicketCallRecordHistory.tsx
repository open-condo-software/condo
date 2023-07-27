import { B2BAppGlobalFeature, SortCallRecordFragmentsBy } from '@app/condo/schema'
import { Col, Row, RowProps } from 'antd'
import { notification } from 'antd'
import React, { CSSProperties, useCallback, useMemo } from 'react'

import { Link } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Alert, Button, Typography } from '@open-condo/ui'

import { useGlobalAppsFeaturesContext } from '@condo/domains/miniapp/components/GlobalApps/GlobalAppsFeaturesContext'
import { CallRecordCard } from '@condo/domains/ticket/components/CallRecordCard'
import { useActiveCall } from '@condo/domains/ticket/contexts/ActiveCallContext'
import { CallRecordFragment } from '@condo/domains/ticket/utils/clientSchema'


interface ITicketCallRecordHistoryProps {
    ticketId: string
    ticketOrganizationId: string
}

const MAIN_ROW_GUTTER: RowProps['gutter'] = [0, 24]
const CALL_RECORDS_ROW_GUTTER: RowProps['gutter'] = [0, 16]

const ALERT_DESCRIPTION_WRAPPER_STYLE: CSSProperties = { paddingTop: '24px' }

export const TicketCallRecordHistory: React.FC<ITicketCallRecordHistoryProps> = (props) => {
    const intl = useIntl()
    const TicketCallRecordHistoryTitle = intl.formatMessage({ id: 'ticket.title.callRecordsHistory' })
    const AttachCallToTicketMessage = intl.formatMessage({ id: 'ticket.callRecord.attachCallRecordToTicket' })
    const AttachMessage = intl.formatMessage({ id: 'global.attach' })
    const NotificationMessage = intl.formatMessage({ id: 'ticket.callRecord.attachCallRecordToTicket.notification.message' })
    const NotificationDescription = intl.formatMessage({ id: 'ticket.callRecord.attachCallRecordToTicket.notification.description' })

    const { ticketId, ticketOrganizationId } = props

    const { requestFeature } = useGlobalAppsFeaturesContext()
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

    const handleAttachCallRecordClick = useCallback(() => {
        requestFeature({
            feature: B2BAppGlobalFeature.AttachCallRecordToTicket,
            ticketId,
            ticketOrganizationId,
        })

        notification.info({ message: NotificationMessage, description: NotificationDescription })
    }, [NotificationDescription, NotificationMessage, requestFeature, ticketId, ticketOrganizationId])

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
                    showAttachCallToTicketAlert && (
                        <Col span={24}>
                            <Alert
                                type='info'
                                message={
                                    <Typography.Title level={4}>{AttachCallToTicketMessage}</Typography.Title>
                                }
                                showIcon
                                description={
                                    <div style={ALERT_DESCRIPTION_WRAPPER_STYLE}>
                                        <Button
                                            id='TicketIndexAttachCallRecord'
                                            icon={<Link size='medium'/>}
                                            type='primary'
                                            onClick={handleAttachCallRecordClick}
                                        >
                                            {AttachMessage}
                                        </Button>
                                    </div>
                                }
                            />
                        </Col>
                    )
                }
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
