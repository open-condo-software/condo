import React, { useCallback, useMemo, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography, Button, Modal } from '@open-condo/ui'

import { Invoice } from '@condo/domains/marketplace/utils/clientSchema'


type useTicketCancelModalType = (updateTicket: (id: string) => void, ticketId: string) => { openModal: (statusCanceledId: string) => void, cancelTicketModal: JSX.Element, closeModal: () => void }

export const useTicketCancelModal: useTicketCancelModalType = (updateTicket, ticketId) => {
    const intl = useIntl()
    const CancelModalTitleMessage = intl.formatMessage({ id: 'pages.condo.ticket.id.CancelModal.title' })
    const CancelButtonLabelMessage = intl.formatMessage({ id: 'pages.condo.ticket.id.CancelModal.cancelButtonLabel' })
    const CancelModalContentMessage = intl.formatMessage({ id: 'pages.condo.ticket.id.CancelModal.content' })
    const CancelModalContentWithInvoices = intl.formatMessage({ id: 'pages.condo.ticket.id.CancelModal.contentWithInvoices' })

    const [isModalVisible, setIsModalVisible] = useState<boolean>(false)
    const [statusCanceledId, setStatusCanceledId] = useState<string | null>(null)

    const { count: invoicesCount } = Invoice.useCount({
        where: {
            ticket: { id: ticketId },
        },
    })

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
                {invoicesCount > 0 ? CancelModalContentWithInvoices : CancelModalContentMessage}
            </Typography.Text>
        </Modal>
    ), [CancelButtonLabelMessage, CancelModalContentMessage, CancelModalContentWithInvoices, CancelModalTitleMessage, closeModal, handleCancelTicket, invoicesCount, isModalVisible])

    return { cancelTicketModal, openModal, closeModal }
}
