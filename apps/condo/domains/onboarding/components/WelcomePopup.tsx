/** @jsx jsx */
import React, { CSSProperties, useCallback, useMemo, useState } from 'react'
import styled from '@emotion/styled'
import { jsx } from '@emotion/react'
import { Col, Image, Row, Typography } from 'antd'
import { Gutter } from 'antd/es/grid/row'

import { useIntl } from '@condo/next/intl'

import { Modal } from '@condo/domains/common/components/Modal'
import { fontSizes, colors, WELCOME_POPUP_BACKGROUND_COLORS } from '@condo/domains/common/constants/style'
import { Button } from '@condo/domains/common/components/Button'

const StyledButton = styled(Button)`
  border: 1px solid ${colors.inputBorderGrey} !important;
  padding: 4px 15px;
`

const MEDIUM_COLUMN_GUTTER: [Gutter, Gutter] = [20, 0]

const ModalFooter = ({ step, setStep, handleModalClose }) => {
    const intl = useIntl()
    const OkMessage = intl.formatMessage({ id: 'OK' })

    const handleNextStepButtonClick = useCallback(() => setStep(currentStep => currentStep + 1), [setStep])
    const handlePrevStepButtonClick = useCallback(() => setStep(currentStep => currentStep - 1), [setStep])

    return (
        <Row justify='space-between'>
            <Col>
                <Row gutter={MEDIUM_COLUMN_GUTTER}>
                    <Col>
                        <StyledButton onClick={handlePrevStepButtonClick} disabled={step === 0} type='text'>
                            ←
                        </StyledButton>
                    </Col>
                    <Col>
                        <StyledButton onClick={handleNextStepButtonClick} disabled={step === 2} type='text'>
                            →
                        </StyledButton>
                    </Col>
                </Row>
            </Col>
            {
                step === 2 && (
                    <Button type='sberDefaultGradient' onClick={handleModalClose}>
                        {OkMessage}
                    </Button>
                )
            }
        </Row>
    )
}

type WelcomePopupImage = {
    src: string
    style: CSSProperties
}

type WelcomePopupStep = {
    imageBackgroundColor: string
    images: WelcomePopupImage[]
}

const BODY_TEXT_STYLES = { fontSize: fontSizes.content, lineHeight: '24px', letterSpacing: '-0.01em' }
const BIG_ROW_GUTTER: [Gutter, Gutter] = [0, 24]
const MEDIUM_ROW_GUTTER: [Gutter, Gutter] = [0, 20]
const SMALL_ROW_GUTTER: [Gutter, Gutter] = [0, 12]

export function WelcomePopup () {
    const intl = useIntl()
    const TitleMessage = intl.formatMessage({ id: 'WelcomePopup.title' })

    const [step, setStep] = useState(0)
    const [visible, setVisible] = useState(true)

    const handleModalClose = useCallback(() => setVisible(false), [setVisible])

    const stepToContent: WelcomePopupStep[] = useMemo(() => ([
        {
            imageBackgroundColor: WELCOME_POPUP_BACKGROUND_COLORS.firstStep,
            images: [{ src: '/welcomePopupStep1.png', style: { maxHeight: '236px' } }],
        },
        {
            imageBackgroundColor: WELCOME_POPUP_BACKGROUND_COLORS.secondStep,
            images: [{ src: '/welcomePopupStep2_1.png', style: { maxHeight: '257px' } }, { src: '/welcomePopupStep2_2.png', style: { maxHeight: '202px', position: 'relative', bottom: '8px' } }],
        },
        {
            imageBackgroundColor: WELCOME_POPUP_BACKGROUND_COLORS.thirdStep,
            images: [{ src: '/welcomePopupStep3.png', style: { maxHeight: '202px' } }],
        },
    ]), [])

    const stepImages = useMemo(() => stepToContent[step].images.map(image => (
        <Col key={image.src}>
            <Image style={image.style} src={image.src} preview={false}/>
        </Col>
    )), [step, stepToContent])

    const backgroundImageStyles = useMemo(() => (
        { backgroundColor: stepToContent[step].imageBackgroundColor, height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px' }
    ), [step, stepToContent])

    return (
        <Modal
            visible={visible}
            onCancel={handleModalClose}
            titleText={TitleMessage}
            footer={<ModalFooter step={step} setStep={setStep} handleModalClose={handleModalClose}/>}
            width={570}
        >
            <Row gutter={BIG_ROW_GUTTER}>
                <Col span={24} style={backgroundImageStyles}>
                    <Row gutter={MEDIUM_ROW_GUTTER}>
                        {stepImages}
                    </Row>
                </Col>
                <Col span={24}>
                    <Row gutter={SMALL_ROW_GUTTER}>
                        <Col>
                            <Typography.Title level={5}>
                                {intl.formatMessage({ id: `WelcomePopup.step${step + 1}.title` })}
                            </Typography.Title>
                        </Col>
                        <Col>
                            <Typography.Paragraph style={BODY_TEXT_STYLES}>
                                {intl.formatMessage({ id: `WelcomePopup.step${step + 1}.text` })}
                            </Typography.Paragraph>
                        </Col>
                    </Row>
                </Col>
            </Row>
        </Modal>
    )
}