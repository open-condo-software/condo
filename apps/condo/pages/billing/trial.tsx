import styled from '@emotion/styled'
import { Col, Row, Space, Typography } from 'antd'
import Router from 'next/router'
import React, { useCallback, useMemo } from 'react'
import AuthLayout from '@condo/domains/user/components/containers/AuthLayout'
import { FocusContainer } from '@condo/domains/common/components/FocusContainer'
import { Button } from '@condo/domains/common/components/Button'
import { colors } from '@condo/domains/common/constants/style'
import { SberIcon } from '@condo/domains/common/components/icons/SberIcon'
import { useIntl } from '@core/next/intl'
import { AuthRequired } from '@condo/domains/common/components/containers/AuthRequired'

interface ITrialPage extends React.FC {
    container?: React.FC
    headerAction?: React.ReactElement
}

type TrialOption = {
    amount: number,
    currency: '₽',
    description: string | React.ReactElement
    active?: boolean
}

const SubscribeOptionAmount = styled.span<{ active?: boolean }>`
  font-size: 38px;
`

const SubscriptionDescription = styled(Typography.Text)`
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  flex-wrap: wrap;
  font-size: 16px;
`

const TrialPage: ITrialPage = () => {
    const intl = useIntl()
    const TrialTitle = intl.formatMessage({ id: 'trial.title' })
    const TrialSubTitle = intl.formatMessage({ id: 'trial.subTitle' })

    // TODO(Dimitreee): prefetch options from server
    const options: Array<TrialOption> = useMemo(() => {
        return (
            [
                {
                    amount: 0,
                    description: <><span>Если ваш расчетный счет в</span>&nbsp;{<SberIcon/>}</>,
                    currency: '₽',
                    active: true,
                },
                {
                    amount: 3.5,
                    description: 'за 1 лицевой счет, если ваш расчетный счет\n в другом банке',
                    currency: '₽',
                },
            ]
        )
    }, [])

    const handleSubscribe = useCallback(() => {
        Router.push('/')
    }, [])

    return (
        <AuthRequired>
            <Row gutter={[0, 40]}>
                <Col span={24}>
                    <Space direction={'vertical'} size={24}>
                        <Typography.Title>
                            {TrialTitle}
                        </Typography.Title>
                        <Typography.Text>
                            {TrialSubTitle}
                        </Typography.Text>
                    </Space>
                </Col>
                <Col span={24}>
                    <Row gutter={[0, 20]}>
                        {options.map((option, index) => {
                            return (
                                <Col span={24} key={index}>
                                    <FocusContainer margin={'0'} color={option.active ? colors.sberPrimary[4] : colors.lightGrey[5]}>
                                        <Space direction={'vertical'} size={8}>
                                            <SubscribeOptionAmount active={option.active}>
                                                <Typography.Text style={{ color: option.active ? colors.sberPrimary[6] : colors.black }}>
                                                    {option.amount} {option.currency}
                                                </Typography.Text>
                                            </SubscribeOptionAmount>
                                            <SubscriptionDescription>{option.description}</SubscriptionDescription>
                                        </Space>
                                    </FocusContainer>
                                </Col>
                            )
                        })}
                    </Row>
                </Col>
                <Col span={24} >
                    <Button type={'sberPrimary'} onClick={handleSubscribe}>
                        Начать пробный период
                    </Button>
                </Col>
            </Row>
        </AuthRequired>
    )
}

TrialPage.container = AuthLayout


export default TrialPage
