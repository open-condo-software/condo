import { Col, Image, Row } from 'antd'
import React, { CSSProperties } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Button, Modal, Space, Typography } from '@open-condo/ui'

import type { RowProps } from 'antd'

const WELCOME_MODAL_PIC_GAP: RowProps['gutter'] = [40, 40]
const WELCOME_MODAL_PIC_SRC = '/billing-welcome.png'
const WELCOME_MODAL_PIC_STYLE: CSSProperties = { borderRadius: 12 }
const WELCOME_MODAL_TEXT_GAP = 16

type WelcomeModalProps = {
    open: boolean,
    onCancel: () => void
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ onCancel, open }) => {
    const intl = useIntl()
    const SectionTitle = intl.formatMessage({ id: 'global.section.accrualsAndPayments' })
    const WelcomeModalTextTitle = intl.formatMessage({ id: 'accrualsAndPayments.onBoardingModal.title' })
    const WelcomeModalTextMessage = intl.formatMessage({ id: 'accrualsAndPayments.onBoardingModal.text' })
    const WelcomeModalCloseButtonLabel = intl.formatMessage({ id: 'accrualsAndPayments.onBoardingModal.closeButton.message' })
    
    return (
        <Modal
            open={open}
            title={SectionTitle}
            width='big'
            onCancel={onCancel}
            footer={
                <Button type='primary' onClick={onCancel}>
                    {WelcomeModalCloseButtonLabel}
                </Button>
            }
        >
            <Row gutter={WELCOME_MODAL_PIC_GAP}>
                <Col span={24}>
                    <Image
                        src={WELCOME_MODAL_PIC_SRC}
                        preview={false}
                        style={WELCOME_MODAL_PIC_STYLE}
                        alt='Billing welcome picture'
                    />
                </Col>
                <Col span={24}>
                    <Space size={WELCOME_MODAL_TEXT_GAP} direction='vertical'>
                        <Typography.Title level={3}>
                            {WelcomeModalTextTitle}
                        </Typography.Title>
                        <Typography.Paragraph>
                            {WelcomeModalTextMessage}
                        </Typography.Paragraph>
                    </Space>
                </Col>
            </Row>
        </Modal>
    )
}