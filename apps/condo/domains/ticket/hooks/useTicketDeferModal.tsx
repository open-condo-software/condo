import { Col, Row } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import dayjs, { Dayjs } from 'dayjs'
import React, { CSSProperties, useCallback, useMemo, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Button, Modal, Typography, Alert } from '@open-condo/ui'

import DatePicker from '@app/condo/domains/common/components/Pickers/DatePicker'


type useTicketDeferModalType = (updateTicket: (statusDeferredId: string, deferredDate: Dayjs) => void) => { openModal: (statusDeferredId: string) => void, closeModal: () => void, deferTicketModal: JSX.Element }

const DEFER_DATE_MODAL_CONTENT_ROW_GUTTER: [Gutter, Gutter] = [0, 24]
const DATE_PICKER_STYLE: CSSProperties = { width: '100%' }
const minDate = dayjs().endOf('day')
const maxDate = dayjs().add(365, 'days').endOf('day')

export const useTicketDeferModal: useTicketDeferModalType = (updateTicket) => {
    const intl = useIntl()
    const DeferDateModalTitleMessage = intl.formatMessage({ id: 'ticket.id.ticketDefer.deferDateModal.title' })
    const DeferDateInputPlaceholderMessage = intl.formatMessage({ id: 'ticket.id.ticketDefer.deferDateModal.deferDateInput.placeholder' })
    const InfoBlockTitleMessage = intl.formatMessage({ id: 'ticket.id.ticketDefer.deferDateModal.infoBlock.title' })
    const InfoBlockContentMessage = intl.formatMessage({ id: 'ticket.id.ticketDefer.deferDateModal.infoBlock.content' })
    const SaveButtonLabelMessage = intl.formatMessage({ id: 'ticket.id.ticketDefer.deferDateModal.saveButton.label' })
    const CancelModalTitleMessage = intl.formatMessage({ id: 'ticket.id.ticketDefer.cancelModal.title' })
    const CancelModalContentMessage = intl.formatMessage({ id: 'ticket.id.ticketDefer.cancelModal.content' })
    const SelectDateButtonLabelMessage = intl.formatMessage({ id: 'ticket.id.ticketDefer.cancelModal.selectDateButton.label' })
    const LeaveCurrentStatusButtonLabelMessage = intl.formatMessage({ id: 'ticket.id.ticketDefer.cancelModal.leaveCurrentStatusButton.label' })

    const [isDeferModalVisible, setIsDeferModalVisible] = useState<boolean>(false)
    const [isCancelModalVisible, setIsCancelModalVisible] = useState<boolean>(false)
    const [deferredDate, setDeferredDate] = useState<Dayjs>(null)
    const [statusDeferredId, setStatusDeferredId] = useState<string | null>(null)

    const openDeferDateModal = useCallback(() => setIsDeferModalVisible(true), [])

    const closeDeferDateModal = useCallback(() => setIsDeferModalVisible(false), [])

    const openCancelModal = useCallback(() => setIsCancelModalVisible(true), [])

    const closeCancelModal = useCallback(() => setIsCancelModalVisible(false), [])

    const handleOpenDeferDateModal = useCallback((statusDeferredId: string) => {
        setStatusDeferredId(statusDeferredId)
        openDeferDateModal()
    }, [openDeferDateModal])

    const handleReset = useCallback(() => {
        setDeferredDate(null)
        closeDeferDateModal()
        closeCancelModal()
        setStatusDeferredId(null)
    }, [closeDeferDateModal, closeCancelModal])

    const handleCloseDeferTicketModal = useCallback(() => {
        setDeferredDate(null)
        closeDeferDateModal()
        openCancelModal()
    }, [closeDeferDateModal, openCancelModal])

    const handleSaveDeferredTicket = useCallback(() => {
        statusDeferredId && updateTicket(statusDeferredId, deferredDate)
        handleReset()
    }, [deferredDate, handleReset, statusDeferredId, updateTicket])

    const handleOpenDeferTicketModal = useCallback(() => {
        closeCancelModal()
        openDeferDateModal()
    }, [closeCancelModal, openDeferDateModal])

    const handleDisabledDate = useCallback((current) => current < minDate || current > maxDate, [])

    const deferDateModal = useMemo(() => (
        <Modal
            open={isDeferModalVisible}
            onCancel={handleCloseDeferTicketModal}
            title={DeferDateModalTitleMessage}
            footer={
                <Button
                    onClick={handleSaveDeferredTicket}
                    disabled={!deferredDate}
                    type='primary'
                >
                    {SaveButtonLabelMessage}
                </Button>
            }
        >
            <Row gutter={DEFER_DATE_MODAL_CONTENT_ROW_GUTTER}>
                <Col span={24}>
                    <DatePicker
                        format='DD MMMM YYYY'
                        value={deferredDate}
                        placeholder={DeferDateInputPlaceholderMessage}
                        onChange={setDeferredDate}
                        style={DATE_PICKER_STYLE}
                        disabledDate={handleDisabledDate}
                    />
                </Col>
                <Col span={24}>
                    <Alert
                        message={InfoBlockTitleMessage}
                        type='warning'
                        description={InfoBlockContentMessage}
                        showIcon
                    />
                </Col>
            </Row>
        </Modal>
    ), [DeferDateInputPlaceholderMessage, DeferDateModalTitleMessage, InfoBlockContentMessage, InfoBlockTitleMessage, SaveButtonLabelMessage, deferredDate, handleCloseDeferTicketModal, handleDisabledDate, handleSaveDeferredTicket, isDeferModalVisible])

    const cancelModal = useMemo(() => (
        <Modal
            width='big'
            open={isCancelModalVisible}
            onCancel={handleReset}
            title={CancelModalTitleMessage}
            footer={[
                <Button key='select-date' onClick={handleOpenDeferTicketModal} type='primary'>
                    {SelectDateButtonLabelMessage}
                </Button>,
                <Button key='leave' onClick={handleReset} type='secondary'>{LeaveCurrentStatusButtonLabelMessage}</Button>,
            ]}
        >
            <Typography.Text type='secondary'>{CancelModalContentMessage}</Typography.Text>
        </Modal>
    ), [CancelModalContentMessage, CancelModalTitleMessage, LeaveCurrentStatusButtonLabelMessage, SelectDateButtonLabelMessage, handleOpenDeferTicketModal, handleReset, isCancelModalVisible])

    const deferTicketModal = useMemo(() => (
        <>
            {deferDateModal}
            {cancelModal}
        </>
    ), [cancelModal, deferDateModal])

    return {
        deferTicketModal,
        openModal: handleOpenDeferDateModal,
        closeModal: handleReset,
    }
}
