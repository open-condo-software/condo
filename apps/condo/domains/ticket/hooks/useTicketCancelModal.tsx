import React, { CSSProperties, useCallback, useMemo, useState } from 'react'
import { Modal, Typography } from 'antd'
import { Button } from '@app/condo/domains/common/components/Button'
import { useIntl } from '@core/next/intl'

type useTicketCancelModalType = (updateTicket: (id: string) => void) => { openModal: (statusCanceledId: string) => void, cancelTicketModal: JSX.Element, closeModal: () => void }

const MODAL_BUTTON_CANCEL_STYLE: CSSProperties = { fontSize: 16 }

export const useTicketCancelModal: useTicketCancelModalType = (updateTicket) => {
    const intl = useIntl()
    const cancelModalTitle = intl.formatMessage({ id: 'pages.condo.ticket.id.CancelModal.title' })
    const cancelButtonLabel = intl.formatMessage({ id: 'pages.condo.ticket.id.CancelModal.cancelButtonLabel' })
    const cancelModalContent = intl.formatMessage({ id: 'pages.condo.ticket.id.CancelModal.content' })

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
            visible={isModalVisible}
            onCancel={closeModal}
            title={cancelModalTitle}
            footer={<Button onClick={handleCancelTicket} type='sberDefaultGradient'>{cancelButtonLabel}</Button>}
        >
            <Typography.Text type='secondary' style={MODAL_BUTTON_CANCEL_STYLE}>
                {cancelModalContent}
            </Typography.Text>
        </Modal>
    ), [cancelButtonLabel, cancelModalContent, cancelModalTitle, closeModal, handleCancelTicket, isModalVisible])

    return { cancelTicketModal, openModal, closeModal }
}
