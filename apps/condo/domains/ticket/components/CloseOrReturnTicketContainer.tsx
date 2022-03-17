import { Button } from '../../common/components/Button'
import { FocusContainer } from '../../common/components/FocusContainer'
import React, { useCallback } from 'react'
import { Col, Row, Typography } from 'antd'
import { fontSizes } from '../../common/constants/style'
import { useIntl } from '@core/next/intl'
import { Ticket } from '../utils/clientSchema'

const containerTextStyles = { margin: 0, fontSize: fontSizes.content }
const buttonTextStyles = { fontWeight: 600 }

export const CloseOrReturnTicketContainer = ({ ticket }) => {
    const intl = useIntl()
    const CloseOrReturnMessage = intl.formatMessage({ id: 'pages.condo.ticket.id.CloseOrReturn' })
    const TicketInWorkMessage = intl.formatMessage({ id: 'pages.condo.ticket.id.TicketInWork' })
    const CloseTicketMessage = intl.formatMessage({ id: 'pages.condo.ticket.id.CloseTicket' })
    const ReturnTicketMessage = intl.formatMessage({ id: 'pages.condo.ticket.id.ReturnTicket' })

    const action = Ticket.useUpdate({})
    const updateAction = useCallback((values) => action(values, ticket), [action, ticket])

    const handleCloseTicketButtonClick = useCallback(() => {
        updateAction({ status: 'c14a58e0-6b5d-4ec2-b91c-980a90111c7d', statusUpdatedAt: new Date() })
    }, [updateAction])

    const handleReturnTicketButtonClick = useCallback(() => {
        updateAction({ status: '6ef3abc4-022f-481b-90fb-8430345ebfc2', statusUpdatedAt: new Date() })
    }, [updateAction])

    return (
        <FocusContainer>
            <Row align="middle" justify={'space-between'} gutter={[40, 0]}>
                <Col>
                    <Typography.Paragraph style={containerTextStyles}>
                        <Typography.Text strong>
                            {CloseOrReturnMessage}
                        </Typography.Text>
                        &nbsp;{TicketInWorkMessage}
                    </Typography.Paragraph>
                </Col>
                <Col>
                    <Row gutter={[20, 0]}>
                        <Col>
                            <Button type={'sberDefaultGradient'} secondary onClick={handleCloseTicketButtonClick}>
                                <Typography.Text style={buttonTextStyles}>{CloseTicketMessage}</Typography.Text>
                            </Button>
                        </Col>
                        <Col>
                            <Button type={'sberDefaultGradient'} secondary onClick={handleReturnTicketButtonClick}>
                                <Typography.Text style={buttonTextStyles}>{ReturnTicketMessage}</Typography.Text>
                            </Button>
                        </Col>
                    </Row>
                </Col>
            </Row>
        </FocusContainer>
    )
}