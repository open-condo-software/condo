import { Alert, Col, Row, Typography } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import dayjs, { Dayjs } from 'dayjs'
import React, { CSSProperties, useCallback, useMemo, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { Button } from '@app/condo/domains/common/components/Button'
import DatePicker from '@app/condo/domains/common/components/Pickers/DatePicker'
import { Modal } from '@condo/domains/common/components/Modal'

type useTicketDeferModalType = (updateTicket: (statusDeferredId: string, deferredDate: Dayjs) => void) => { openModal: (statusDeferredId: string) => void, closeModal: () => void, deferTicketModal: JSX.Element }

const MODAL_CONTENT_TEXT_STYLE: CSSProperties = { fontSize: 16 }
const DEFER_DATE_MODAL_CONTENT_ROW_GUTTER: [Gutter, Gutter] = [0, 24]
const CANCEL_MODAL_FOOTER_GUTTER: [Gutter, Gutter] = [16, 16]
const DATE_PICKER_STYLE: CSSProperties = { width: '100%' }
const minDate = dayjs().endOf('day')
const maxDate = dayjs().add(365, 'days').endOf('day')

export const useTicketDeferModal: useTicketDeferModalType = (updateTicket) => {
    const intl = useIntl()
    const DeferDateModalTitleMessage = intl.formatMessage({ id: 'pages.condo.ticket.id.TicketDefer.DeferDateModal.title' })
    const DeferDateInputPlaceholderMessage = intl.formatMessage({ id: 'pages.condo.ticket.id.TicketDefer.DeferDateModal.DeferDateInput.placeholder' })
    const InfoBlockTitleMessage = intl.formatMessage({ id: 'pages.condo.ticket.id.TicketDefer.DeferDateModal.InfoBlock.title' })
    const InfoBlockContentMessage = intl.formatMessage({ id: 'pages.condo.ticket.id.TicketDefer.DeferDateModal.InfoBlock.content' })
    const SaveButtonLabelMessage = intl.formatMessage({ id: 'pages.condo.ticket.id.TicketDefer.DeferDateModal.SaveButton.label' })
    const CancelModalTitleMessage = intl.formatMessage({ id: 'pages.condo.ticket.id.TicketDefer.CancelModal.title' })
    const CancelModalContentMessage = intl.formatMessage({ id: 'pages.condo.ticket.id.TicketDefer.CancelModal.content' })
    const SelectDateButtonLabelMessage = intl.formatMessage({ id: 'pages.condo.ticket.id.TicketDefer.CancelModal.SelectDateButton.label' })
    const LeaveCurrentStatusButtonLabelMessage = intl.formatMessage({ id: 'pages.condo.ticket.id.TicketDefer.CancelModal.LeaveCurrentStatusButton.label' })

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
            visible={isDeferModalVisible}
            onCancel={handleCloseDeferTicketModal}
            title={DeferDateModalTitleMessage}
            footer={
                <Button
                    onClick={handleSaveDeferredTicket}
                    disabled={!deferredDate}
                    type='sberDefaultGradient'
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
                        message={<Typography.Title level={5}>{InfoBlockTitleMessage}</Typography.Title>}
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
            visible={isCancelModalVisible}
            onCancel={handleReset}
            title={CancelModalTitleMessage}
            footer={<Row gutter={CANCEL_MODAL_FOOTER_GUTTER} justify='end'>
                <Col>
                    <Button onClick={handleOpenDeferTicketModal} type='sberDefaultGradient'>{SelectDateButtonLabelMessage}</Button>
                </Col>
                <Col>
                    <Button onClick={handleReset} type='sberBlack'>{LeaveCurrentStatusButtonLabelMessage}</Button>
                </Col>
            </Row>}
        >
            <Typography.Text type='secondary' style={MODAL_CONTENT_TEXT_STYLE}>{CancelModalContentMessage}</Typography.Text>
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
