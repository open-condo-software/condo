import React from 'react'
import { useIntl } from '@open-condo/next/intl'
import { Modal, Typography, Button } from '@open-condo/ui'
import { CONTEXT_IN_PROGRESS_STATUS, CONTEXT_FINISHED_STATUS, CONTEXT_ERROR_STATUS } from '@condo/domains/miniapp/constants'

type ConnectModalProps = {
    miniappHasFrame: boolean
    contextStatus?: CONTEXT_FINISHED_STATUS | CONTEXT_IN_PROGRESS_STATUS | CONTEXT_ERROR_STATUS
    open: boolean
    closeModal: () => void
}

export const ConnectModal: React.FC<ConnectModalProps> = ({
    contextStatus,
    miniappHasFrame,
    open,
    closeModal,
}) => {
    const intl = useIntl()

    if (!contextStatus || contextStatus === CONTEXT_ERROR_STATUS || (contextStatus === CONTEXT_FINISHED_STATUS && !miniappHasFrame)) {
        return null
    }

    const ModalTitle = intl.formatMessage({ id: `miniapp.connectModal.${contextStatus}.title` })
    const ModalMessage = intl.formatMessage({ id: `miniapp.connectModal.${contextStatus}.message` })
    const ModalButtonLabel = intl.formatMessage({ id: `miniapp.connectModal.${contextStatus}.button` })

    const modalFooter = contextStatus === CONTEXT_FINISHED_STATUS ? null : (
        <Button type='primary' onClick={closeModal}>
            {ModalButtonLabel}
        </Button>
    )

    return (
        <Modal
            title={ModalTitle}
            open={open}
            onCancel={closeModal}
            footer={modalFooter}
            destroyOnClose
        >
            <Typography.Text type='secondary'>
                {ModalMessage}
            </Typography.Text>
        </Modal>
    )
}