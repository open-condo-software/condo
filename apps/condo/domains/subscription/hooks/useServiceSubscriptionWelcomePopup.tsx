import { useGetTrialServiceSubscriptionQuery } from '@app/condo/gql'
import styled from '@emotion/styled'
import { Col, Row } from 'antd'
import dayjs from 'dayjs'
import cookie from 'js-cookie'
import getConfig from 'next/config'
import React, { useState, Dispatch, SetStateAction, useEffect } from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { FormattedMessage } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Modal, Typography, Button } from '@open-condo/ui'

import { SUBSCRIPTION } from '@condo/domains/common/constants/featureflags'
import { fontSizes } from '@condo/domains/common/constants/style'



const { canEnableSubscriptions } = getConfig()


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

    const { useFlag } = useFeatureFlags()

    const hasSubscriptionFeature = useFlag(SUBSCRIPTION) && canEnableSubscriptions

    const { organization } = useOrganization()
    const { user } = useAuth()

    const [isServiceSubscriptionWelcomePopupVisible, setIsServiceSubscriptionWelcomePopupVisible] = useState<boolean>(false)

    const thisMinute = dayjs().startOf('minute').toISOString()
    const cookieSubscriberFirstLoginPopupConfirmedInfo = cookie.get('subscriberFirstLoginPopupConfirmedInfo')
    const subscriberFirstLoginPopupConfirmedInfo = cookieSubscriberFirstLoginPopupConfirmedInfo ?
        JSON.parse(cookieSubscriberFirstLoginPopupConfirmedInfo) : []

    const { data, loading: subscriptionsLoading } = useGetTrialServiceSubscriptionQuery({
        variables: {
            organizationId: organization?.id || null,
            finishAtGte: thisMinute,
        },
        skip: !hasSubscriptionFeature || !organization?.id,
    })

    useEffect(() => {
        if (
            data?.subscriptions?.length > 0 &&
            !subscriptionsLoading &&
            !isServiceSubscriptionWelcomePopupVisible &&
            !subscriberFirstLoginPopupConfirmedInfo.find(info =>
                info.organization === organization.id && info.user === user.id)
        )
            setIsServiceSubscriptionWelcomePopupVisible(true)
    }, [subscriptionsLoading])

    const subscription = data?.subscriptions?.length ? data.subscriptions[0] : null

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
            open={isServiceSubscriptionWelcomePopupVisible}
            onCancel={handleCloseModal}
            title={GratitudeMessage}
            footer={[
                <Button
                    key='submit'
                    type='primary'
                    onClick={handleCloseModal}
                >
                    {CompleteActionMessage}
                </Button>,
            ]}
        >
            <Row gutter={[0, 40]}>
                <Col span={24}>
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
                            id='subscription.modal.newClient.trialTimeEndDate'
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
