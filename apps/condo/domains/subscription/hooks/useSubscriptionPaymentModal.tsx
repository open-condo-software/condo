import { Col, Row } from 'antd'
import React, { useState, Dispatch, SetStateAction } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Modal, Typography, Button } from '@open-condo/ui'

interface IApplySubscriptionModal {
    SubscriptionPaymentModal: React.FC
    setIsVisible: Dispatch<SetStateAction<boolean>>
    isVisible: boolean
}

export const useSubscriptionPaymentModal = (): IApplySubscriptionModal => {
    const intl = useIntl()
    const ModalTitle = intl.formatMessage({ id: 'subscription.modal.complete.title' })
    const ModalCompleteActionMessage = intl.formatMessage({ id: 'subscription.modal.complete.action' })
    const ModalCompleteDescription = intl.formatMessage({ id: 'subscription.modal.complete.description' })

    const [isVisible, setIsVisible] = useState<boolean>(false)

    const SubscriptionPaymentModal: React.FC = () => (
        <Modal
            title={ModalTitle}
            open={isVisible}
            onCancel={() => setIsVisible(false)}
            footer={[
                <Button
                    key='submit'
                    type='primary'
                    onClick={() => {
                        setIsVisible(false)
                    }}
                >
                    {ModalCompleteActionMessage}
                </Button>,
            ]}
        >
            <Row gutter={[0, 40]}>
                <Col span={24}>
                    <Typography.Text>
                        {ModalCompleteDescription}
                    </Typography.Text>
                </Col>
            </Row>
        </Modal>
    )

    return {
        isVisible,
        setIsVisible,
        SubscriptionPaymentModal,
    }
}
