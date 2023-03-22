import { DeleteFilled } from '@ant-design/icons'
import { Typography } from 'antd'
import React, { useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Button, ButtonProps, Modal, Space } from '@open-condo/ui'

// import { Modal } from '@condo/domains/common/components/Modal'
import { runMutation } from '@condo/domains/common/utils/mutations.utils'

export interface IDeleteActionButtonWithConfirmModal {
    title: string
    message: string
    okButtonLabel: string
    buttonCustomProps?: ButtonProps
    buttonContent?: string
    action: () => Promise<any>
    showCancelButton?: boolean
}

/**
 * Displays button, on click displays modal, on confirm executes provided `action` in `runMutation`.
 * Automatically controls loading state
 */
export const DeleteButtonWithConfirmModal: React.FC<IDeleteActionButtonWithConfirmModal> = ({
    title,
    message,
    okButtonLabel,
    buttonCustomProps,
    buttonContent,
    action,
    showCancelButton,
}) => {
    const intl = useIntl()
    const CancelMessage = intl.formatMessage({ id: 'Cancel' })

    const [isConfirmVisible, setIsConfirmVisible] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    const showConfirm = () => setIsConfirmVisible(true)
    const handleCancel = () => setIsConfirmVisible(false)

    const handleDeleteButtonClick = () => {
        setIsConfirmVisible(false)
        setIsDeleting(true)
        runMutation(
            {
                action,
                onError: (e) => {
                    console.log(e)
                    console.error(e.friendlyDescription)
                    throw e
                },
                intl,
            },
        ).then(() => {
            setIsDeleting(false)
        })
    }

    return (
        <>
            <Button
                key='submit'
                onClick={showConfirm}
                type='secondary'
                loading={isDeleting}
                danger
                {...buttonCustomProps}
                icon={buttonContent ? null : <DeleteFilled />}
            >
                {buttonContent}
            </Button>
            <Modal
                title={title}
                open={isConfirmVisible}
                onCancel={handleCancel}
                footer={
                    <Space size={12}>
                        <Button
                            key='submit'
                            type='secondary'
                            danger
                            onClick={handleDeleteButtonClick}
                        >
                            {okButtonLabel}
                        </Button>
                        {showCancelButton && (
                            <Button key='cancel' type='secondary' onClick={handleCancel}>
                                {CancelMessage}
                            </Button>
                        )}
                    </Space>
                }
            >
                <Typography.Text>
                    {message}
                </Typography.Text>
            </Modal>
        </>

    )
}
