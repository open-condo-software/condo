import React, { useState, Dispatch, SetStateAction } from 'react'
import { Col, Row, Typography } from 'antd'

import { Modal } from '@condo/domains/common/components/Modal'
import { useIntl } from '@condo/next/intl'
import { Button } from '@condo/domains/common/components/Button'

interface IApplySubscriptionModal {
    SubscriptionPaymentModal: React.FC
    setIsVisible: Dispatch<SetStateAction<boolean>>
    isVisible: boolean
}

export const useSubscriptionPaymentModal = (): IApplySubscriptionModal => {
    const intl = useIntl()

    const [isVisible, setIsVisible] = useState<boolean>(false)

    const SubscriptionPaymentModal: React.FC = () => (
        <Modal
            title={<Typography.Title level={3}>{intl.formatMessage({ id: 'subscription.modal.complete.title' })}</Typography.Title>}
            visible={isVisible}
            onCancel={() => setIsVisible(false)}
            footer={[
                <Button
                    size='large'
                    key='submit'
                    type='sberPrimary'
                    onClick={() => {
                        setIsVisible(false)
                    }}
                >
                    {intl.formatMessage({ id: 'subscription.modal.complete.action' })}
                </Button>,
            ]}
        >
            <Row gutter={[0, 40]}>
                <Col span={24}>
                    <Typography.Text>
                        {intl.formatMessage({ id: 'subscription.modal.complete.description' })}
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
