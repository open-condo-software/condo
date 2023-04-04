import { Alert, Col, Row, Table, Typography } from 'antd'
import dayjs from 'dayjs'
import get from 'lodash/get'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'

import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'


import { getSubscriptionOptions } from './subscriptionOptions'

import { ServiceSubscription } from '../../../../schema'
import { useSubscriptionPaymentModal } from '../../hooks/useSubscriptionPaymentModal'
import { useServiceSubscriptionContext } from '../SubscriptionContext'

const getActiveSubscriptionData = (intl, subscription: ServiceSubscription, isExpired) => {
    const ActiveMessage = intl.formatMessage({ id: 'subscription.status.active' })
    const ExpiredMessage = intl.formatMessage({ id: 'subscription.status.expired' })
    const SbbolSubscriptionTypeMessage = intl.formatMessage({ id: 'subscription.type.sbbol' })
    const DefaultSubscriptionTypeMessage = intl.formatMessage({ id: 'subscription.type.default' })
    const TariffMessage = intl.formatMessage({ id: 'subscription.data.tariff' })
    const StatusMessage = intl.formatMessage({ id: 'subscription.data.status' })
    const TrialMessage = intl.formatMessage({ id: 'subscription.type.trial' })
    const ExpiredDate = intl.formatMessage({ id: 'subscription.type.expiredDate' })

    if (!subscription) {
        return []
    }

    let tariffMessage = get(subscription, 'type') === 'sbbol' ? SbbolSubscriptionTypeMessage : DefaultSubscriptionTypeMessage

    if (get(subscription, 'isTrial')) {
        tariffMessage += ` (${TrialMessage})`
    }

    return [
        {
            attribute: TariffMessage,
            value: tariffMessage,
        },
        {
            attribute: StatusMessage,
            value: !isExpired ? ActiveMessage : ExpiredMessage,
        },
        {
            attribute: ExpiredDate,
            value: dayjs(get(subscription, 'finishAt')).format('DD.MM.YYYY'),
        },
    ]
}

export const SubscriptionPane: React.FC = () => {
    const { breakpoints } = useLayoutContext()
    const intl = useIntl()
    const TariffsMessage = intl.formatMessage({ id: 'subscription.data.tariffs' })
    const SubscriptionMessage = intl.formatMessage({ id: 'subscription.data.subscription' })
    const SbbolSubscriptionDeclineMessage = intl.formatMessage({ id: 'subscription.alert.subscription.payment.decline.sbbol' })
    const DefaultSubscriptionDeclineMessage = intl.formatMessage({ id: 'subscription.alert.subscription.payment.decline.default' })
    const { subscription, isExpired } = useServiceSubscriptionContext()

    const { isVisible, setIsVisible, SubscriptionPaymentModal } = useSubscriptionPaymentModal()
    const subscriptions = getSubscriptionOptions(intl, subscription, setIsVisible)
    const activeSubscriptionData = getActiveSubscriptionData(intl, subscription, isExpired)

    return (
        <>
            <Row gutter={[0, 60]}>
                <Col span={24}>
                    <Row gutter={[0, 20]}>
                        <Col span={24}>
                            <Typography.Title level={3}>
                                {TariffsMessage}
                            </Typography.Title>
                        </Col>
                        <Col span={24}>
                            <Row gutter={[0, 20]}>
                                {
                                    subscriptions.map((subscription, index) => {
                                        return (
                                            <Col sm={24} lg={8} offset={!breakpoints.TABLET_LARGE || (index % 2 === 0) ? 0 : 1 } key={index}>
                                                {subscription}
                                            </Col>
                                        )
                                    })
                                }
                            </Row>
                        </Col>
                    </Row>
                </Col>
                {
                    activeSubscriptionData.length > 0 && (
                        <Col span={24}>
                            <Row gutter={[0, 20]}>
                                <Col span={24}>
                                    <Typography.Title level={3}>
                                        {SubscriptionMessage}
                                    </Typography.Title>
                                </Col>
                                <Col span={24}>
                                    <Table
                                        columns={[
                                            { dataIndex: 'attribute', key: 'attribute' },
                                            { dataIndex: 'value', key: 'value' },
                                        ]}
                                        dataSource={activeSubscriptionData}
                                        pagination={false}
                                        bordered
                                    />
                                </Col>
                                {subscription && !isExpired && (
                                    <Col span={24}>
                                        <Alert
                                            message={
                                                get(subscription, 'type') === 'sbbol'
                                                    ? SbbolSubscriptionDeclineMessage
                                                    : DefaultSubscriptionDeclineMessage
                                            }
                                            type='warning'
                                            showIcon
                                        />
                                    </Col>
                                )}
                            </Row>
                        </Col>
                    )
                }
                {isVisible && <SubscriptionPaymentModal/>}
            </Row>
        </>
    )
}
