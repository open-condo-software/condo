import { Incident as IIncident, IncidentStatusType } from '@app/condo/schema'
import { Col, Form, Row } from 'antd'
import dayjs, { Dayjs } from 'dayjs'
import isFunction from 'lodash/isFunction'
import React, { useCallback, useMemo, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Button, Modal, Typography } from '@open-condo/ui'

import { Incident } from '@condo/domains/ticket/utils/clientSchema'

import DatePicker from '../../common/components/Pickers/DatePicker'


const DATE_PICKER_STYLE: React.CSSProperties = { width: '100%' }

type UseIncidentUpdateStatusModalType = (props: {
    incident: IIncident
    afterUpdate?: (date: Dayjs) => void
}) => {
    handleOpen: () => void
    IncidentUpdateStatusModal: JSX.Element
}

export const useIncidentUpdateStatusModal: UseIncidentUpdateStatusModalType = ({ incident, afterUpdate }) => {
    const intl = useIntl()
    const WorkFinishFieldMessage = intl.formatMessage({ id: 'incident.fields.workFinish.label' })
    const SaveLabel = intl.formatMessage({ id: 'incident.modalChangeStatus.save' })
    const ToActualStatusTitle = intl.formatMessage({ id: 'incident.modalChangeStatus.toActualStatus.title' })
    const ToNotActualStatusTitle = intl.formatMessage({ id: 'incident.modalChangeStatus.toNotActualStatus.title' })
    const ToNotActualBeforeWorkFinishMessage = intl.formatMessage({ id: 'incident.modalChangeStatus.toActualStatus.beforeWorkFinish.descriptions' })
    const ToNotActualAfterWorkFinishMessage = intl.formatMessage({ id: 'incident.modalChangeStatus.toActualStatus.afterWorkFinish.descriptions' })
    const ToActualMessage = intl.formatMessage({ id: 'incident.modalChangeStatus.toNotActualStatus.descriptions' })

    const [open, setOpen] = useState<boolean>(false)
    const [date, setDate] = useState<Dayjs>(null)
    const [isLoading, setIsLoading] = useState<boolean>(false)

    const update = Incident.useUpdate({})

    const isActual = incident.status === IncidentStatusType.Actual
    const isOverdue = useMemo(() => incident.workFinish && dayjs().diff(incident.workFinish) > 0, [incident.workFinish])

    const handleOpen = useCallback(() => {
        setOpen(true)
        setDate(incident.workFinish ? dayjs(incident.workFinish) : dayjs())
    }, [incident.workFinish])

    const handleClose = useCallback(() => {
        setOpen(false)
    }, [])

    const handleUpdate = useCallback(async () => {
        console.log({
            finish: date?.toISOString() || null,
            start: incident.workStart,
        })
        setIsLoading(true)
        try {
            await update({
                status: isActual
                    ? IncidentStatusType.NotActual
                    : IncidentStatusType.Actual,
                workFinish: date ? date.toISOString() : null,
            }, incident)
            handleClose()
            if (isFunction(afterUpdate)) {
                await afterUpdate(date)
            }
        } finally {
            setIsLoading(false)
        }
    }, [afterUpdate, date, handleClose, incident, isActual, update])

    const handleDisabledDate = useCallback((date: Dayjs) => {
        return date.diff(incident.workStart) <= 0
    }, [incident.workStart])

    const descriptionText = useMemo(() => {
        if (!isActual) {
            return ToActualMessage
        }

        if (isOverdue) {
            return ToNotActualAfterWorkFinishMessage
        }

        return ToNotActualBeforeWorkFinishMessage
    }, [ToActualMessage, ToNotActualAfterWorkFinishMessage, ToNotActualBeforeWorkFinishMessage, isActual, isOverdue])

    const IncidentUpdateStatusModal = useMemo(() => {
        return (
            <Modal
                onCancel={handleClose}
                open={open}
                title={
                    isActual
                        ? ToNotActualStatusTitle
                        : ToActualStatusTitle
                }
                footer={(
                    <Button
                        type='primary'
                        children={SaveLabel}
                        onClick={handleUpdate}
                        disabled={isLoading}
                    />
                )}
            >
                <Row gutter={[0, 16]}>
                    <Col span={24}>
                        <Typography.Text type='secondary'>
                            {descriptionText}
                        </Typography.Text>
                    </Col>
                    <Col span={24}>
                        <Form.Item
                            label={WorkFinishFieldMessage}
                            labelCol={{ span: 24 }}
                        >
                            <DatePicker
                                value={date}
                                onChange={setDate}
                                showTime
                                format='DD.MM.YYYY HH:mm'
                                disabledDate={handleDisabledDate}
                                style={DATE_PICKER_STYLE}
                                allowClear={!isActual}
                                disabled={isLoading}
                            />
                        </Form.Item>
                    </Col>
                </Row>
            </Modal>
        )
    }, [SaveLabel, ToActualStatusTitle, ToNotActualStatusTitle, WorkFinishFieldMessage, date, descriptionText, handleClose, handleDisabledDate, handleUpdate, isActual, isLoading, open])

    return {
        handleOpen,
        IncidentUpdateStatusModal,
    }
}
