import { TicketStatus, TicketStatusTypeType } from '@app/condo/schema'
import React, { CSSProperties, useCallback, useMemo, useState } from 'react'
import { Modal, Typography } from 'antd'
import { Button } from '@app/condo/domains/common/components/Button'
import { useIntl } from '@core/next/intl'

type useTicketCancelModalType = (updateTicket: (id: string) => void, statuses: TicketStatus[]) => { openModal: () => void, cancelTicketModal: JSX.Element, closeModal: () => void }

const MODAL_BUTTON_CANCEL_STYLE: CSSProperties = { fontSize: 16 }

export const useTicketCancelModal: useTicketCancelModalType = (updateTicket, statuses) => {
    const intl = useIntl()
    const cancelModalTitle = intl.formatMessage({ id: 'pages.condo.ticket.id.CancelModal.title' })
    const cancelButtonLabel = intl.formatMessage({ id: 'pages.condo.ticket.id.CancelModal.cancelButtonLabel' })
    const cancelModalContent = intl.formatMessage({ id: 'pages.condo.ticket.id.CancelModal.content' })

    const [isModalVisible, setIsModalVisible] = useState<boolean>(false)

    const statusCanceledId = useMemo(
        () => statuses.find((status) => status.type === TicketStatusTypeType.Canceled)?.id,
        [statuses]
    )

    const openModal = useCallback(() => {
        setIsModalVisible(true)
    }, [])

    const closeModal = useCallback(() => {
        setIsModalVisible(false)
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
