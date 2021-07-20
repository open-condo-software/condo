import styled from '@emotion/styled'
import { Col, Row, Space, Typography } from 'antd'
import React from 'react'
import AuthLayout from '@condo/domains/user/components/containers/AuthLayout'
import { FocusContainer } from '@condo/domains/common/components/FocusContainer'
import { Button } from '@condo/domains/common/components/Button'
import { colors } from '@condo/domains/common/constants/style'
import { SberIcon } from '@condo/domains/common/components/icons/SberIcon'

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

const SubscribeOptionAmount = styled(Typography.Text)<{ active?: boolean }>`
  font-size: 38px;
  ${({ active }) => (active ? `color: ${colors.sberPrimary[6]};` : '')}
`

const SubscriptionDescription = styled(Typography.Text)`
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  flex-wrap: wrap;
  font-size: 16px;
`

const TrialPage: ITrialPage = () => {
    const options: Array<TrialOption> = [
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

    return (
        <Row gutter={[0, 40]}>
            <Col span={24}>
                <Space direction={'vertical'} size={24}>
                    <Typography.Title>
                        Бесплатный период 14 дней
                    </Typography.Title>
                    <Typography.Text>А после...</Typography.Text>
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
                                            {option.amount} {option.currency}
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
                <Button type={'sberPrimary'}>
                    Начать пробный период
                </Button>
            </Col>
        </Row>
    )
}

TrialPage.container = AuthLayout


export default TrialPage
