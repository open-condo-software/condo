import { CheckOutlined } from '@ant-design/icons'
import styled from '@emotion/styled'
import { Col, Row, Typography } from 'antd'
import classNames from 'classnames'
import get from 'lodash/get'
import React, { Dispatch, SetStateAction } from 'react'

import { Button } from '@condo/domains/common/components/Button'
import { hasFeature } from '@condo/domains/common/components/containers/FeatureFlag'
import { FocusContainer } from '@condo/domains/common/components/FocusContainer'
import { SberIcon, SberIconWithoutLabel } from '@condo/domains/common/components/icons/SberIcon'
import { colors } from '@condo/domains/common/constants/style'

import { ServiceSubscription } from '../../../../schema'

const StyledTitle = styled(Typography.Title)`
  color: ${colors.sberPrimary[6]};
`

export const getSubscriptionOptions = (intl, subscription: ServiceSubscription, setIsVisible: Dispatch<SetStateAction<boolean>>) => {
    const ClientsMessage = intl.formatMessage({ id: 'subscription.option.description.clients' })
    const ActiveMessage = intl.formatMessage({ id: 'subscription.action.active' })
    const LoginBySbbolMessage = intl.formatMessage({ id: 'LoginBySBBOL' })
    const DescriptionDefaultMessage = intl.formatMessage({ id: 'subscription.option.description.default' })
    const ActiveActionMessage = intl.formatMessage({ id: 'subscription.action.active' })
    const CreateBillMessage = intl.formatMessage({ id: 'subscription.data.createBill' })

    const type = get(subscription, 'type')
    const focusContainerClassNames = classNames({
        ['disabled']: subscription && type === 'sbbol',
    })

    return [
        (
            <FocusContainer margin='0' key='sbbol'>
                <Row gutter={[0, 20]}>
                    <Col span={24}>
                        <Typography.Paragraph>
                            <Row gutter={[0, 8]}>
                                <Col span={24}>
                                    <StyledTitle>
                                        1 ₽ / год
                                    </StyledTitle>
                                </Col>
                                <Col>
                                    <Typography.Text>
                                        <Row align='middle'>
                                            <Typography.Text>{ClientsMessage}</Typography.Text>&nbsp;<SberIcon/>
                                        </Row>
                                    </Typography.Text>
                                </Col>
                            </Row>
                        </Typography.Paragraph>
                    </Col>
                    <Col span={24}>
                        {
                            subscription && !get(subscription, 'isTrial') && type === 'sbbol'
                                ? (
                                    <Button
                                        key='submit'
                                        type='sberAction'
                                        disabled
                                        icon={<CheckOutlined />}
                                    >
                                        {ActiveMessage}
                                    </Button>
                                )
                                : (
                                    <Button
                                        key='submit'
                                        type='sberAction'
                                        icon={<SberIconWithoutLabel/>}
                                        href='/api/sbbol/auth'
                                    >
                                        {LoginBySbbolMessage}
                                    </Button>
                                )
                        }
                    </Col>
                </Row>
            </FocusContainer>
        ),
        (
            <FocusContainer margin='0' key='default' className={focusContainerClassNames}>
                <Row gutter={[0, 20]}>
                    <Col span={24}>
                        <Typography.Paragraph>
                            <Row gutter={[0, 8]}>
                                <Col span={24}>
                                    <Typography.Title>
                                        3,5 ₽ / мес.
                                    </Typography.Title>
                                </Col>
                                <Col>
                                    <Typography.Text>
                                        {DescriptionDefaultMessage}
                                    </Typography.Text>
                                </Col>
                            </Row>
                        </Typography.Paragraph>
                    </Col>
                    <Col span={24}>
                        {
                            subscription && !get(subscription, 'isTrial') && type === 'default'
                                ? (
                                    <Button
                                        disabled
                                        type='sberPrimary'
                                        icon={<CheckOutlined />}
                                    >
                                        {ActiveActionMessage}
                                    </Button>
                                )
                                : (
                                    <Button type='sberPrimary' onClick={() => setIsVisible(true)}>
                                        {CreateBillMessage}
                                    </Button>
                                )
                        }
                    </Col>
                </Row>
            </FocusContainer>
        ),
    ]
}
