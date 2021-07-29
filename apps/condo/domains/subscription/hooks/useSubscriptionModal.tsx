import styled from '@emotion/styled'
import { Col, Modal, Row, Space, Typography } from 'antd'
import React, { useState, Dispatch, SetStateAction, useMemo } from 'react'
import { useIntl } from '@core/next/intl'
import { Button } from '../../common/components/Button'
import { FocusContainer } from '../../common/components/FocusContainer'
import { colors } from '../../common/constants/style'
import { useSubscriptionContext } from '../components/SubscriptionContext'

interface IApplySubscriptionModal {
    SubscriptionModal: React.FC
    setVisible: Dispatch<SetStateAction<boolean>>
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

export const useApplySubscriptionModal = (): IApplySubscriptionModal => {
    const intl = useIntl()
    const TrialTitle = intl.formatMessage({ id: 'trial.title' })
    const TrialSubTitle = intl.formatMessage({ id: 'trial.subTitle' })
    const StartTrialPeriodLabel = intl.formatMessage({ id: 'trial.startPeriod' })
    const { activateSubscription, options } = useSubscriptionContext()

    const [visible, setVisible] = useState<boolean>(false)

    const SubscriptionModal: React.FC = () => (
        <Modal
            closable={false}
            title={<h2 style={{ fontWeight: 'bold', lineHeight: '22px', marginBottom: '0px' }}>{TrialTitle}</h2>}
            visible={visible}
            footer={[
                <Button key="submit" type="sberPrimary" onClick={() => {
                    activateSubscription()
                    setVisible(false)
                }}>{StartTrialPeriodLabel}</Button>,
            ]}
        >
            <Row gutter={[0, 40]}>
                <Col span={24}>
                    <Typography.Text>
                        {TrialSubTitle}
                    </Typography.Text>
                </Col>
                <Col span={24}>
                    <Row gutter={[0, 20]}>
                        {options?.map((option, index) => {
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
            </Row>
        </Modal>
    )

    return {
        SubscriptionModal,
        setVisible,
    }
}
