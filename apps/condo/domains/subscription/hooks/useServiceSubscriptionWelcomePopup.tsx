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
    const { organization } = useOrganization()

    const [isServiceSubscriptionWelcomePopupVisible, setIsServiceSubscriptionWelcomePopupVisible] = useState<boolean>(false)

    const thisMinute = dayjs().startOf('minute').toISOString()
    const isSubscriberFirstLoginPopupConfirmed = cookie.get('isSubscriberFirstLoginPopupConfirmed')

    const { objs: subscriptions, loading: subscriptionsLoading } = ServiceSubscription.useObjects({
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
            !isSubscriberFirstLoginPopupConfirmed
        )
            setIsServiceSubscriptionWelcomePopupVisible(true)
    }, [subscriptionsLoading])

    const subscription = subscriptions && subscriptions.length > 0 && subscriptions[0]

    const ServiceSubscriptionWelcomePopup = () => (
        <Modal
            visible={isServiceSubscriptionWelcomePopupVisible}
            onCancel={() => {
                setIsServiceSubscriptionWelcomePopupVisible(false)
                cookie.set('isSubscriberFirstLoginPopupConfirmed', true)
            }}
            width={600}
            bodyStyle={{ padding: '30px' }}
            footer={[
                <Button
                    size='large'
                    key='submit'
                    type='sberPrimary'
                    onClick={() => {
                        setIsServiceSubscriptionWelcomePopupVisible(false)
                        cookie.set('isSubscriberFirstLoginPopupConfirmed', true)
                    }}
                >
                    {intl.formatMessage({ id: 'subscription.modal.complete.action' })}
                </Button>,
            ]}
        >
            <Row gutter={[0, 40]}>
                <Col span={24}>
                    <ServiceSubscriptionWelcomePopupParagraph strong>
                        {intl.formatMessage({ id: 'subscription.modal.newClient.gratitude' })}
                    </ServiceSubscriptionWelcomePopupParagraph>
                    <ServiceSubscriptionWelcomePopupParagraph>
                        {intl.formatMessage({ id: 'subscription.modal.newClient.trialTime' })}
                    </ServiceSubscriptionWelcomePopupParagraph>
                    <ServiceSubscriptionWelcomePopupParagraph>
                        {intl.formatMessage({ id: 'subscription.modal.newClient.debitsInfo' })}
                    </ServiceSubscriptionWelcomePopupParagraph>
                    <ServiceSubscriptionWelcomePopupParagraph>
                        {intl.formatMessage({ id: 'subscription.modal.newClient.currentTariff' })}
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
                        {intl.formatMessage({ id: 'subscription.modal.newClient.serviceDisconnect' })}
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
