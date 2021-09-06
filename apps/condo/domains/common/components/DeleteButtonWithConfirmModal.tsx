// @ts-nocheck
import { ButtonProps, Typography } from 'antd'
import { Button } from './Button'
import Modal from 'antd/lib/modal/Modal'
import React, { useState } from 'react'
import { DeleteFilled } from '@ant-design/icons'
import { runMutation } from '@condo/domains/common/utils/mutations.utils'
import { useIntl } from '@core/next/intl'

interface IDeleteActionButtonWithConfirmModal {
    title: string
    message: string
    okButtonLabel: string
    buttonCustomProps?: ButtonProps
    buttonContent?: React.ReactNode
    action: () => Promise<any>
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
}) => {
    const intl = useIntl()
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
                    console.log(e.friendlyDescription)
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
                type='sberDanger'
                loading={isDeleting}
                secondary
                {...buttonCustomProps}
            >
                {buttonContent || <DeleteFilled/>}
            </Button>
            <Modal
                title={
                    <Typography.Title style={{ fontSize: '24px', lineHeight: '32px' }}>
                        {title}
                    </Typography.Title>
                }
                visible={isConfirmVisible}
                onCancel={handleCancel}
                footer={[
                    <Button
                        key="submit"
                        type='sberDanger'
                        onClick={handleDeleteButtonClick}
                        style={{ margin: '15px' }}
                    >
                        {okButtonLabel}
                    </Button>,
                ]}
            >
                <Typography.Text>
                    {message}
                </Typography.Text>
            </Modal>
        </>

    )
}