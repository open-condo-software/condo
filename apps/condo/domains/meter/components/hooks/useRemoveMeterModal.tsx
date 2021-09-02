import Modal from 'antd/lib/modal/Modal'
import { Typography } from 'antd'
import { Button } from '../../../common/components/Button'
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
                <Typography.Title style={{ fontSize: '24px', lineHeight: '32px' }}>
                    {ConfirmDeleteTitle}
                </Typography.Title>
            }
            visible={isRemoveModalVisible}
            onCancel={handleCancel}
            footer={[
                <Button
                    key="submit"
                    type='sberPrimary'
                    onClick={() => setIsRemoveModalVisible(false)}
                    style={{ margin: '15px' }}
                >
                    {DontDeleteLabel}
                </Button>,
                <Button
                    key="submit"
                    type='sberDanger'
                    onClick={removeAction}
                    style={{ margin: '15px' }}
                >
                    {DeleteLabel}
                </Button>,
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