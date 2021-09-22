import Modal from 'antd/lib/modal/Modal'
import { Col, Row, Typography } from 'antd'
import { Button } from '@condo/domains/common/components/Button'
import React, { useCallback, useState } from 'react'
import { useIntl } from '@core/next/intl'


export const useRemoveMeterModal = () => {
    const intl = useIntl()
    const ConfirmDeleteTitle = intl.formatMessage({ id: 'pages.condo.meter.form.ConfirmDeleteTitle' })
    const DeleteLabel = intl.formatMessage({ id: 'Delete' })
    const DontDeleteLabel = intl.formatMessage({ id: 'DontDelete' })
    const ConfirmDeleteMessage = intl.formatMessage({ id: 'pages.condo.property.form.ConfirmDeleteMessage' })

    const [isRemoveModalVisible, setIsRemoveModalVisible] = useState(false)

    const handleCancel = useCallback(() => {
        setIsRemoveModalVisible(false)
    }, [])

    const RemoveModal = ({ removeAction }) => (
        <Modal
            title={
                <Typography.Title level={3}>
                    {ConfirmDeleteTitle}
                </Typography.Title>
            }
            visible={isRemoveModalVisible}
            onCancel={handleCancel}
            footer={[
                <Row key="footer" justify={'end'} gutter={[15, 0]}>
                    <Col>
                        <Button
                            type='sberPrimary'
                            onClick={() => setIsRemoveModalVisible(false)}
                        >
                            {DontDeleteLabel}
                        </Button>
                    </Col>
                    <Col>
                        <Button
                            type='sberDanger'
                            onClick={removeAction}
                        >
                            {DeleteLabel}
                        </Button>
                    </Col>
                </Row>,
            ]}
        >
            <Typography.Text>
                {ConfirmDeleteMessage}
            </Typography.Text>
        </Modal>
    )

    return {
        RemoveModal,
        setIsRemoveModalVisible,
    }
}