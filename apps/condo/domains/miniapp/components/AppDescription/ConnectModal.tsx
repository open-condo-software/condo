import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Modal, Typography } from '@open-condo/ui'

import { CONTEXT_IN_PROGRESS_STATUS, CONTEXT_FINISHED_STATUS, CONTEXT_ERROR_STATUS } from '@condo/domains/miniapp/constants'

type ConnectModalProps = {
    miniappHasFrame: boolean
    miniappHasIcon: boolean
    contextStatus?: CONTEXT_FINISHED_STATUS | CONTEXT_IN_PROGRESS_STATUS | CONTEXT_ERROR_STATUS
    open: boolean
    closeModal: () => void
}

export const ConnectModal: React.FC<ConnectModalProps> = ({
    contextStatus,
    miniappHasFrame,
    open,
    closeModal,
    miniappHasIcon,
}) => {
    const intl = useIntl()

    if (!contextStatus || contextStatus === CONTEXT_ERROR_STATUS || (contextStatus === CONTEXT_FINISHED_STATUS && !miniappHasFrame)) {
        return null
    }

    const postFix = contextStatus === CONTEXT_FINISHED_STATUS && miniappHasIcon ? '.withIcon' : ''

    const ModalTitle = intl.formatMessage({ id: `miniapp.connectModal.${contextStatus}${postFix}.title` })
    const ModalMessage = intl.formatMessage({ id: `miniapp.connectModal.${contextStatus}${postFix}.message` })

    return (
        <Modal
            title={ModalTitle}
            open={open}
            onCancel={closeModal}
            destroyOnClose
        >
            <Typography.Text type='secondary'>
                {ModalMessage}
            </Typography.Text>
        </Modal>
    )
}