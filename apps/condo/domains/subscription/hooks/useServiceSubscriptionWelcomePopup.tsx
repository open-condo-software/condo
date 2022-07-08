import React, { useState, Dispatch, SetStateAction, useEffect } from 'react'
import { Col, Modal, Row, Typography } from 'antd'
import { useIntl } from '@core/next/intl'
import { Button } from '@condo/domains/common/components/Button'
import styled from '@emotion/styled'
import { fontSizes } from '@condo/domains/common/constants/style'
import { FormattedMessage } from 'react-intl'
import dayjs from 'dayjs'
import cookie from 'js-cookie'
import { useOrganization } from '@core/next/organization'
import { ServiceSubscription } from '../utils/clientSchema'
import { ServiceSubscriptionTypeType } from '@app/condo/schema'
import { useAuth } from '@core/next/auth'

interface IServiceSubscriptionWelcomePopup {
    ServiceSubscriptionWelcomePopup: React.FC
    setIsServiceSubscriptionWelcomePopupVisible: Dispatch<SetStateAction<boolean>>
    isServiceSubscriptionWelcomePopupVisible: boolean
}

const ServiceSubscriptionWelcomePopupParagraph = styled(Typography.Paragraph)`
  font-size: ${fontSizes.content};
  padding: 0;
  margin: 0;
`

export const useServiceSubscriptionWelcomePopup = (): IServiceSubscriptionWelcomePopup => {
    const intl = useIntl()
    const CompleteActionMessage = intl.formatMessage({ id: 'subscription.modal.complete.action' })
    const GratitudeMessage = intl.formatMessage({ id: 'subscription.modal.newClient.gratitude' })
    const TrialTimeMessage = intl.formatMessage({ id: 'subscription.modal.newClient.trialTime' })
    const DebitsInfoMessage = intl.formatMessage({ id: 'subscription.modal.newClient.debitsInfo' })
    const CurrentTariffMessage = intl.formatMessage({ id: 'subscription.modal.newClient.currentTariff' })
    const ServiceDisconnectMessage = intl.formatMessage({ id: 'subscription.modal.newClient.serviceDisconnect' })

    const { organization } = useOrganization()
    const { user } = useAuth()

    const [isServiceSubscriptionWelcomePopupVisible, setIsServiceSubscriptionWelcomePopupVisible] = useState<boolean>(false)

    const thisMinute = dayjs().startOf('minute').toISOString()
    const cookieSubscriberFirstLoginPopupConfirmedInfo = cookie.get('subscriberFirstLoginPopupConfirmedInfo')
    const subscriberFirstLoginPopupConfirmedInfo = cookieSubscriberFirstLoginPopupConfirmedInfo ?
        JSON.parse(cookieSubscriberFirstLoginPopupConfirmedInfo) : []

    const { objs: subscriptions, loading: subscriptionsLoading } = ServiceSubscription.useNewObjects({
        where: {
            organization: { id: organization && organization.id },
            type: ServiceSubscriptionTypeType.Sbbol,
            isTrial: true,
            finishAt_gte: thisMinute,
        },
    })

    useEffect(() => {
        if (
            subscriptions.length > 0 &&
            !subscriptionsLoading &&
            !isServiceSubscriptionWelcomePopupVisible &&
            !subscriberFirstLoginPopupConfirmedInfo.find(info =>
                info.organization === organization.id && info.user === user.id)
        )
            setIsServiceSubscriptionWelcomePopupVisible(true)
    }, [subscriptionsLoading])

    const subscription = subscriptions && subscriptions.length > 0 && subscriptions[0]

    const handleCloseModal = () => {
        setIsServiceSubscriptionWelcomePopupVisible(false)
        const newConfirmedInfo = {
            organization: organization && organization.id,
            user: user && user.id,
        }
        const newCookieSubscriberFirstLoginPopupConfirmedInfo = Array.isArray(subscriberFirstLoginPopupConfirmedInfo) ?
            [...subscriberFirstLoginPopupConfirmedInfo, newConfirmedInfo] : [newConfirmedInfo]

        cookie.set('subscriberFirstLoginPopupConfirmedInfo', JSON.stringify(newCookieSubscriberFirstLoginPopupConfirmedInfo))
    }

    const ServiceSubscriptionWelcomePopup = () => (
        <Modal
            visible={isServiceSubscriptionWelcomePopupVisible}
            onCancel={handleCloseModal}
            centered
            width={600}
            bodyStyle={{ padding: '30px' }}
            footer={[
                <Button
                    size='large'
                    key='submit'
                    type='sberPrimary'
                    onClick={handleCloseModal}
                >
                    {CompleteActionMessage}
                </Button>,
            ]}
        >
            <Row gutter={[0, 40]}>
                <Col span={24}>
                    <ServiceSubscriptionWelcomePopupParagraph strong>
                        {GratitudeMessage}
                    </ServiceSubscriptionWelcomePopupParagraph>
                    <ServiceSubscriptionWelcomePopupParagraph>
                        {TrialTimeMessage}
                    </ServiceSubscriptionWelcomePopupParagraph>
                    <ServiceSubscriptionWelcomePopupParagraph>
                        {DebitsInfoMessage}
                    </ServiceSubscriptionWelcomePopupParagraph>
                    <ServiceSubscriptionWelcomePopupParagraph>
                        {CurrentTariffMessage}
                    </ServiceSubscriptionWelcomePopupParagraph>
                    <ServiceSubscriptionWelcomePopupParagraph>
                        <FormattedMessage
                            id={'subscription.modal.newClient.trialTimeEndDate' }
                            values={{
                                endDate: subscription ? dayjs(subscription.finishAt).format('DD/MM/YYYY') : null,
                            }}
                        />
                    </ServiceSubscriptionWelcomePopupParagraph>
                    <ServiceSubscriptionWelcomePopupParagraph>
                        {ServiceDisconnectMessage}
                    </ServiceSubscriptionWelcomePopupParagraph>
                </Col>
            </Row>
        </Modal>
    )

    return {
        isServiceSubscriptionWelcomePopupVisible,
        setIsServiceSubscriptionWelcomePopupVisible,
        ServiceSubscriptionWelcomePopup,
    }
}
