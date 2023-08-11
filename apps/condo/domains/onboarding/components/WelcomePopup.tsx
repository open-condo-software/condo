/** @jsx jsx */
import { css, jsx } from '@emotion/react'
import { Col, Image, Row, Typography, Modal } from 'antd'
import React, { CSSProperties, useCallback, useMemo, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { Button } from '@condo/domains/common/components/Button'
import { CrossIcon } from '@condo/domains/common/components/icons/CrossIcon'
import { fontSizes, colors, WELCOME_POPUP_BACKGROUND_COLORS } from '@condo/domains/common/constants/style'


const modalCss = css`
  .ant-modal-content {
    padding: 0;
  }

  .ant-image-img {
    width: auto;
    max-width: 100%;
  }

  .ant-modal-header {
    border-bottom: none;
    padding: 40px;
    
    .ant-typography {
      font-weight: 700;
      font-size: 20px;
      line-height: 28px;
    }
  }
  
  .ant-modal-body {
    padding: 0 40px 20px 40px;
    
    .ant-col {
      display: flex;
      align-items: flex-end;
    }
  }

  .ant-modal-footer {
    padding: 0;
    
    .ant-btn {
      border: 1px solid ${colors.inputBorderGrey};
      padding: 4px 15px;
    }
  }
`

const crossIconStyles = css`
  position: relative;
  bottom: 8px;
  right: 3px;
`

const ModalHeader = ({ handleModalClose }) => {
    const intl = useIntl()
    const TitleMessage = intl.formatMessage({ id: 'welcomePopup.title' })

    return (
        <Row justify='space-between'>
            <Col>
                <Typography.Title level={3}>{TitleMessage}</Typography.Title>
            </Col>
            <Col>
                <CrossIcon onClick={handleModalClose} css={crossIconStyles}/>
            </Col>
        </Row>
    )
}

const MODAL_ROW_STYLES = { padding: '20px 40px' }

const ModalFooter = ({ step, setStep, handleModalClose }) => {
    const intl = useIntl()
    const OkMessage = intl.formatMessage({ id: 'OK' })

    const handleNextStepButtonClick = useCallback(() => setStep(currentStep => currentStep + 1), [setStep])
    const handlePrevStepButtonClick = useCallback(() => setStep(currentStep => currentStep - 1), [setStep])

    return (
        <Row style={MODAL_ROW_STYLES} justify='space-between'>
            <Col>
                <Row gutter={[20, 0]}>
                    <Col>
                        <Button onClick={handlePrevStepButtonClick} disabled={step === 0} type='text'>
                            ←
                        </Button>
                    </Col>
                    <Col>
                        <Button onClick={handleNextStepButtonClick} disabled={step === 2} type='text'>
                            →
                        </Button>
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

export function WelcomePopup () {
    const intl = useIntl()

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
            css={modalCss}
            centered
            visible={visible}
            closable={false}
            onCancel={handleModalClose}
            title={<ModalHeader handleModalClose={handleModalClose}/>}
            footer={<ModalFooter step={step} setStep={setStep} handleModalClose={handleModalClose}/>}
            width={570}
        >
            <Row gutter={[0, 24]}>
                <Col span={24} style={backgroundImageStyles}>
                    <Row gutter={[0, 20]}>
                        {stepImages}
                    </Row>
                </Col>
                <Col span={24}>
                    <Row gutter={[0, 12]}>
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