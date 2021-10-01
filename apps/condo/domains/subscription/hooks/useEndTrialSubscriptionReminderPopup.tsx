import React, { useState, Dispatch, SetStateAction, useEffect } from 'react'
import { Col, Modal, Row, Typography } from 'antd'
import { useIntl } from '@core/next/intl'
import { Button } from '@condo/domains/common/components/Button'
import styled from '@emotion/styled'
import { fontSizes } from '@condo/domains/common/constants/style'
import { FormattedMessage } from 'react-intl'
import { ServiceSubscriptionTypeType } from '@app/condo/schema'
import dayjs from 'dayjs'
import cookie from 'js-cookie'
import { useOrganization } from '@core/next/organization'
import { ServiceSubscription } from '../utils/clientSchema'

interface IEndTrialSubscriptionReminderPopup {
    EndTrialSubscriptionReminderPopup: React.FC
    setIsSEndTrialSubscriptionReminderPopupVisible: Dispatch<SetStateAction<boolean>>
    isEndTrialSubscriptionReminderPopupVisible: boolean
}

const EndTrialSubscriptionReminderPopupParagraph = styled(Typography.Paragraph)`
  font-size: ${fontSizes.content};
  padding: 0;
  margin: 0;
`

export const useEndTrialSubscriptionReminderPopup = (): IEndTrialSubscriptionReminderPopup => {
    const intl = useIntl()

    const [isEndTrialSubscriptionReminderPopupVisible, setIsSEndTrialSubscriptionReminderPopupVisible] = useState<boolean>(false)

    const { organization } = useOrganization()

    const threeDaysLater = dayjs().startOf('hour').add(3, 'days').toISOString()
    const isEndTrialSubscriptionReminderPopupConfirmed = cookie.get('isEndTrialSubscriptionReminderPopupConfirmed')

    const { objs: subscriptions, loading: subscriptionsLoading } = ServiceSubscription.useObjects({
        where: {
            organization: { id: organization && organization.id },
            type: ServiceSubscriptionTypeType.Sbbol,
            isTrial: true,
            finishAt_lte: threeDaysLater,
        },
    })

    useEffect(() => {
        if (
            subscriptions.length > 0 &&
            !subscriptionsLoading &&
            !isEndTrialSubscriptionReminderPopupVisible &&
            !isEndTrialSubscriptionReminderPopupConfirmed
        )
            setIsSEndTrialSubscriptionReminderPopupVisible(true)
    }, [subscriptionsLoading])

    const subscription = subscriptions && subscriptions.length > 0 && subscriptions[0]

    const EndTrialSubscriptionReminderPopup = () => (
        <Modal
            visible={isEndTrialSubscriptionReminderPopupVisible}
            onCancel={() => {
                setIsSEndTrialSubscriptionReminderPopupVisible(false)
                cookie.set('isEndTrialSubscriptionReminderPopupConfirmed', true)
            }}
            centered
            width={600}
            bodyStyle={{ padding: '30px' }}
            footer={[
                <Button
                    size='large'
                    key='submit'
                    type='sberPrimary'
                    onClick={() => {
                        setIsSEndTrialSubscriptionReminderPopupVisible(false)
                        cookie.set('isEndTrialSubscriptionReminderPopupConfirmed', true)
                    }}
                >
                    {intl.formatMessage({ id: 'subscription.modal.complete.action' })}
                </Button>,
            ]}
        >
            <Row gutter={[0, 40]}>
                <Col span={24}>
                    <EndTrialSubscriptionReminderPopupParagraph strong>
                        {intl.formatMessage({ id: 'subscription.modal.newClient.gratitude' })}
                    </EndTrialSubscriptionReminderPopupParagraph>
                    <EndTrialSubscriptionReminderPopupParagraph>
                        <FormattedMessage
                            id={'subscription.modal.endTrialReminder.daysToEndTrial' }
                            values={{
                                days: subscription && dayjs.duration(dayjs(subscription.finishAt).diff(dayjs())).humanize(),
                            }}
                        />
                    </EndTrialSubscriptionReminderPopupParagraph>
                    <EndTrialSubscriptionReminderPopupParagraph>
                        {intl.formatMessage({ id: 'subscription.modal.newClient.serviceDisconnect' })}
                    </EndTrialSubscriptionReminderPopupParagraph>
                </Col>
            </Row>
        </Modal>
    )

    return {
        isEndTrialSubscriptionReminderPopupVisible,
        setIsSEndTrialSubscriptionReminderPopupVisible,
        EndTrialSubscriptionReminderPopup,
    }
}
