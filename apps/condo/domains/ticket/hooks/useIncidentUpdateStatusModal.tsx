import React, { useCallback, useMemo, useState } from 'react'
import dayjs, { Dayjs } from 'dayjs'
import { Incident as IIncident, IncidentStatusType } from '@app/condo/schema'
import { Button, Modal, Typography } from '@open-condo/ui'
import { Incident } from '@condo/domains/ticket/utils/clientSchema'
import DatePicker from '../../common/components/Pickers/DatePicker'
import { Col, Form, Row } from 'antd'
import isFunction from 'lodash/isFunction'


const DATE_PICKER_STYLE: React.CSSProperties = { width: '100%' }

type UseIncidentUpdateStatusModalType = (props: {
    incident: IIncident
    beforeUpdate?: (date: Dayjs) => void
}) => {
    handleOpen: () => void
    IncidentUpdateStatusModal: JSX.Element
}

export const useIncidentUpdateStatusModal: UseIncidentUpdateStatusModalType = ({ incident, beforeUpdate }) => {
    const WorkFinishFieldMessage = 'Завершение работ'
    const SaveLabel = 'Все верно'
    const IncidentUpdateToActualStatusModalTitle = 'Запись актуальна?'
    const IncidentUpdateToNotActualStatusModalTitle = 'Запись больше не актуальна?'
    // до указанного срока
    const ToNotActualBeforeWorkFinishMessage = 'Если работы выполнены до указанного срока, мы изменим статус записи. А также дату и время завершения работ. Запись можно отредактировать позже.'
    // после указанного срока
    const ToNotActualAfterWorkFinishMessage = 'Работы выполнены позже указанного срока. Мы изменим статус записи, а также дату и время завершения работ. Запись можно отредактировать в любое время.'
    const ToActualMessage = 'Если вы хотите изменить статус отключения, не забудьте исправить дату завершения работ на актуальную'

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
            if (isFunction(beforeUpdate)) {
                await beforeUpdate(date)
            }
        } finally {
            setIsLoading(false)
        }
    }, [beforeUpdate, date, handleClose, incident, isActual, update])

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
    }, [isActual, isOverdue])

    const IncidentUpdateStatusModal = useMemo(() => {
        return (
            <Modal
                onCancel={handleClose}
                open={open}
                title={
                    isActual
                        ? IncidentUpdateToNotActualStatusModalTitle
                        : IncidentUpdateToActualStatusModalTitle
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
    }, [date, descriptionText, handleClose, handleDisabledDate, handleUpdate, isActual, isLoading, open])

    return {
        handleOpen,
        IncidentUpdateStatusModal,
    }
}
