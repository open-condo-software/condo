import { Typography } from 'antd'
import React, { useState } from 'react'

import { Trash } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Button, ButtonProps, Modal } from '@open-condo/ui'

import { runMutation } from '@condo/domains/common/utils/mutations.utils'

export interface IDeleteActionButtonWithConfirmModal {
    title: string
    message: string
    okButtonLabel: string
    buttonCustomProps?: ButtonProps
    buttonContent?: string
    action: () => Promise<any>
    showCancelButton?: boolean
    showButtonIcon?: boolean
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
    showButtonIcon = false,
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
                icon={showButtonIcon || !buttonContent ? <Trash size='medium' /> : null}
            >
                {buttonContent}
            </Button>
            <Modal
                title={title}
                open={isConfirmVisible}
                onCancel={handleCancel}
                footer={[
                    <Button
                        key='submit'
                        type='secondary'
                        danger
                        onClick={handleDeleteButtonClick}
                    >
                        {okButtonLabel}
                    </Button>,
                    showCancelButton && (
                        <Button key='cancel' type='secondary' onClick={handleCancel}>
                            {CancelMessage}
                        </Button>
                    ),
                ]}
            >
                <Typography.Text>
                    {message}
                </Typography.Text>
            </Modal>
        </>

    )
}
