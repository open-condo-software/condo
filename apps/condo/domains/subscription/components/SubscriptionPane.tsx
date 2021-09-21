import styled from '@emotion/styled'
import { Alert, Col, Row, Table, Typography } from 'antd'
import React from 'react'
import { Button } from '@condo/domains/common/components/Button'
import { FocusContainer } from '@condo/domains/common/components/FocusContainer'
import { useResponsive } from '@condo/domains/common/hooks/useResponsive'
import { useIntl } from '@core/next/intl'
import { SberIcon } from '@condo/domains/common/components/icons/SberIcon'
import { colors } from '@condo/domains/common/constants/style'
import { useSubscriptionPaymentModal } from '../hooks/useSubscriptionPaymentModal'

const StyledTitle = styled(Typography.Title)`
  color: ${colors.sberPrimary[5]};
`

const getSubscriptionOptions = (intl, setIsVisible) => {
    return [
        {
            renderTitle: () => (// Fetch from backend
                <StyledTitle style={{ color: colors.sberPrimary[6] }}>
                    1 ₽ / год
                </StyledTitle>
            ),
            renderDescription: () => (// Fetch from backend
                <Row align={'middle'}>
                    <Typography.Text>{intl.formatMessage({ id: 'subscription.option.description.clients' })}</Typography.Text>&nbsp;<SberIcon/>
                </Row>
            ),
            renderAction: () => <Button type='sberAction'>{intl.formatMessage({ id: 'LoginBySBBOL' })}</Button>,
        },
        {
            renderTitle: () => (// Fetch from backend
                <Typography.Title>
                    3,5 ₽ / мес.
                </Typography.Title>
            ),
            renderDescription: () => (// Fetch from backend
                <Typography.Text>
                    {intl.formatMessage({ id: 'subscription.option.description.clients' })}
                </Typography.Text>
            ),
            renderAction: () => (
                <Button type='sberPrimary' onClick={() => setIsVisible(true)}>
                    {intl.formatMessage({ id: 'subscription.data.createBill' })}
                </Button>
            ),
        },
    ]
}

const getActiveSubscriptionData = (intl) => {
    return [
        {
            attribute: intl.formatMessage({ id: 'subscription.data.tariff' }),
            value: 'Для клиентов Сбера', // Fetch from backend
        },
        {
            attribute: intl.formatMessage({ id: 'subscription.data.status' }),
            value: 'Активная', // Fetch from backend
        },
        {
            attribute: intl.formatMessage({ id: 'subscription.data.accountsCount' }),
            value: '100', // Fetch from backend
        },
        {
            attribute: intl.formatMessage({ id: 'subscription.data.value' }),
            value: '0.00 рублей', // Fetch from backend
        },
    ]
}

export const SubscriptionPane: React.FC = () => {
    const { isSmall } = useResponsive()
    const intl = useIntl()

    const { isVisible, setIsVisible, SubscriptionPaymentModal } = useSubscriptionPaymentModal()
    const subscriptions = getSubscriptionOptions(intl, setIsVisible)
    const activeSubscription = getActiveSubscriptionData(intl)

    return (
        <>
            <Row gutter={[0, 60]}>
                <Col span={24}>
                    <Row gutter={[0, 20]}>
                        <Col span={24}>
                            <Typography.Title level={3}>
                                {intl.formatMessage({ id: 'subscription.data.tariffs' })}
                            </Typography.Title>
                        </Col>
                        <Col span={24}>
                            <Row gutter={[0, 20]}>
                                {subscriptions.map((subscription, index) => {
                                    return (
                                        <Col sm={24} lg={8} offset={isSmall || (index % 2 === 0) ? 0 : 1 } key={index}>
                                            <FocusContainer margin={'0'}>
                                                <Row gutter={[0, 20]}>
                                                    <Col span={24}>
                                                        <Typography.Paragraph>
                                                            <Row gutter={[0, 8]}>
                                                                <Col span={24}>
                                                                    {subscription.renderTitle()}
                                                                </Col>
                                                                <Col>
                                                                    <Typography.Text>
                                                                        {subscription.renderDescription()}
                                                                    </Typography.Text>
                                                                </Col>
                                                            </Row>
                                                        </Typography.Paragraph>
                                                    </Col>
                                                    <Col span={24}>
                                                        {subscription.renderAction()}
                                                    </Col>
                                                </Row>
                                            </FocusContainer>
                                        </Col>
                                    )
                                })}
                            </Row>
                        </Col>
                    </Row>
                </Col>
                <Col span={24}>
                    <Row gutter={[0, 20]}>
                        <Col span={24}>
                            <Typography.Title level={3}>
                                {intl.formatMessage({ id: 'subscription.data.subscription' })}
                            </Typography.Title>
                        </Col>
                        <Col span={24}>
                            <Alert
                                message={intl.formatMessage({ id: 'subscription.alert.subscription.payment.pending' })}
                                type={'warning'}
                                showIcon
                            />
                        </Col>
                        <Col span={24}>
                            <Table
                                columns={[
                                    { dataIndex: 'attribute', key: 'attribute' },
                                    { dataIndex: 'value', key: 'value' },
                                ]}
                                dataSource={activeSubscription}
                                pagination={false}
                                bordered
                            />
                        </Col>
                        <Col span={24}>
                            <Button type='sberDanger'>
                                {intl.formatMessage({ id: 'subscription.data.cancelSubscription' })}
                            </Button>
                        </Col>
                    </Row>
                </Col>
            </Row>
            {isVisible && <SubscriptionPaymentModal/>}
        </>
    )
}
