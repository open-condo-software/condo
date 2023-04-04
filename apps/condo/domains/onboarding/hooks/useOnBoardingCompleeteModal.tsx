import styled from '@emotion/styled'
import { Col, Row } from 'antd'
import { useRouter } from 'next/router'
import React, { useState, Dispatch, SetStateAction } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Modal, Button, Typography } from '@open-condo/ui'

import { Poster } from '@condo/domains/common/components/Poster'

const PosterWrapper = styled.div`
  height: 320px;
  border-radius: 4px;
`

interface IApplySubscriptionModal {
    OnBoardingCompleteModal: React.FC
    setIsVisible: Dispatch<SetStateAction<boolean>>
    isVisible: boolean
}

export const useOnBoardingCompleteModal = (): IApplySubscriptionModal => {
    const intl = useIntl()
    const router = useRouter()

    const OnBoardingCompleteTitle = intl.formatMessage({ id: 'onboarding.complete.title' })
    const OnBoardingCompleteSubTitle = intl.formatMessage({ id: 'onboarding.complete.subtitle' })
    const OnBoardingCompleteDescription = intl.formatMessage({ id: 'onboarding.complete.description' })
    const OnBoardingCompleteButton = intl.formatMessage({ id: 'onboarding.complete.button' })

    const [isVisible, setIsVisible] = useState<boolean>(false)

    const OnBoardingCompleteModal: React.FC = () => (
        <Modal
            title={OnBoardingCompleteTitle}
            open={isVisible}
            footer={[
                <Button key='submit' type='primary' onClick={() => {
                    setIsVisible(false)
                    if (router.pathname === '/onboarding') {
                        router.push('/')
                    }
                }}>{OnBoardingCompleteButton}</Button>,
            ]}
        >
            <Row gutter={[0, 40]}>
                <Col span={24}>
                    <PosterWrapper>
                        <Poster src='/onBoardingSuccess.png'/>
                    </PosterWrapper>
                </Col>
                <Col span={24}>
                    <Typography.Title level={4}>
                        {OnBoardingCompleteSubTitle}
                    </Typography.Title>
                    <Typography.Text>
                        {OnBoardingCompleteDescription}
                    </Typography.Text>
                </Col>
            </Row>
        </Modal>
    )

    return {
        isVisible,
        setIsVisible,
        OnBoardingCompleteModal,
    }
}