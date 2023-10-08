import React, { useCallback, useMemo, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography, Button, Modal } from '@open-condo/ui'


type useTicketCancelModalType = (updateTicket: (id: string) => void) => { openModal: (statusCanceledId: string) => void, cancelTicketModal: JSX.Element, closeModal: () => void }

export const useTicketCancelModal: useTicketCancelModalType = (updateTicket) => {
    const intl = useIntl()
    const CancelModalTitleMessage = intl.formatMessage({ id: 'pages.condo.ticket.id.CancelModal.title' })
    const CancelButtonLabelMessage = intl.formatMessage({ id: 'pages.condo.ticket.id.CancelModal.cancelButtonLabel' })
    const CancelModalContentMessage = intl.formatMessage({ id: 'pages.condo.ticket.id.CancelModal.content' })

    const [isModalVisible, setIsModalVisible] = useState<boolean>(false)
    const [statusCanceledId, setStatusCanceledId] = useState<string | null>(null)

    const openModal = useCallback((statusCanceledId: string) => {
        setIsModalVisible(true)
        setStatusCanceledId(statusCanceledId)
    }, [])

    const closeModal = useCallback(() => {
        setIsModalVisible(false)
        setStatusCanceledId(null)
    }, [])

    const handleCancelTicket = useCallback(() => {
        statusCanceledId && updateTicket(statusCanceledId)
        closeModal()
    }, [closeModal, statusCanceledId, updateTicket])

    const cancelTicketModal = useMemo(() => (
        <Modal
            open={isModalVisible}
            onCancel={closeModal}
            title={CancelModalTitleMessage}
            footer={<Button onClick={handleCancelTicket} type='primary'>{CancelButtonLabelMessage}</Button>}
        >
            <Typography.Text type='secondary'>
                {CancelModalContentMessage}
            </Typography.Text>
        </Modal>
    ), [CancelButtonLabelMessage, CancelModalContentMessage, CancelModalTitleMessage, closeModal, handleCancelTicket, isModalVisible])

    return { cancelTicketModal, openModal, closeModal }
}
