import {
    useUpdateIncidentMutation,
    GetIncidentByIdQuery,
} from '@app/condo/gql'
import { IncidentStatusType } from '@app/condo/schema'
import { Col, ColProps, Form, FormInstance, Row, RowProps } from 'antd'
import dayjs, { Dayjs } from 'dayjs'
import isFunction from 'lodash/isFunction'
import React, { useCallback, useMemo, useRef, useState } from 'react'

import { getClientSideSenderInfo } from '@open-condo/codegen/utils/userId'
import { useIntl } from '@open-condo/next/intl'
import { Button, Modal, Typography } from '@open-condo/ui'

import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import DatePicker from '@condo/domains/common/components/Pickers/DatePicker'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { analytics } from '@condo/domains/common/utils/analytics'
import { handleChangeDate } from '@condo/domains/ticket/components/IncidentForm/BaseIncidentForm'

import type { FormRule as Rule } from 'antd'


const DATE_PICKER_STYLE: React.CSSProperties = { width: '100%' }
const SHOW_TIME_CONFIG = { defaultValue: dayjs('00:00:00:000', 'HH:mm:ss:SSS') }
const ITEM_LABEL_COL: ColProps = { span: 24 }
const MODAL_GUTTER: RowProps['gutter'] = [0, 16]

type UseIncidentUpdateStatusModalType = (props: {
    incident: GetIncidentByIdQuery['incident']
    afterUpdate?: (date: Dayjs) => void
}) => {
    handleOpen: () => void
    IncidentUpdateStatusModal: JSX.Element
}

// TODO: remove dublicate code from BaseIncidentForm
export const getFinishWorkRules: (incident, error: string) => Rule[] = (incident, error) => [() => {
    return {
        type: 'date',
        message: error,
        validator: (rule, workFinish: Dayjs) => {
            const workStart: string = incident?.workStart
            if (workStart && workFinish) {
                const diff = dayjs(workFinish).diff(workStart)
                if (diff < 0) return Promise.reject()
            }
            return Promise.resolve()
        },
    }
}]

export const useIncidentUpdateStatusModal: UseIncidentUpdateStatusModalType = ({ incident, afterUpdate }) => {
    const intl = useIntl()
    const WorkFinishFieldMessage = intl.formatMessage({ id: 'incident.fields.workFinish.label' })
    const WorkFinishErrorMessage = intl.formatMessage({ id: 'incident.fields.workFinish.error.lessThenWorkStart' })
    const SaveLabel = intl.formatMessage({ id: 'incident.modalChangeStatus.save' })
    const ToActualStatusTitle = intl.formatMessage({ id: 'incident.modalChangeStatus.toActualStatus.title' })
    const ToNotActualStatusTitle = intl.formatMessage({ id: 'incident.modalChangeStatus.toNotActualStatus.title' })
    const ToNotActualBeforeWorkFinishMessage = intl.formatMessage({ id: 'incident.modalChangeStatus.toActualStatus.beforeWorkFinish.descriptions' })
    const ToNotActualAfterWorkFinishMessage = intl.formatMessage({ id: 'incident.modalChangeStatus.toActualStatus.afterWorkFinish.descriptions' })
    const ToActualMessage = intl.formatMessage({ id: 'incident.modalChangeStatus.toNotActualStatus.descriptions' })

    const formRef = useRef<FormInstance>(null)
    const [open, setOpen] = useState<boolean>(false)

    const { requiredValidator } = useValidations()

    const [updateIncident] = useUpdateIncidentMutation()

    const isActual = incident.status === IncidentStatusType.Actual
    const isOverdue = useMemo(() => incident.workFinish && dayjs().set('seconds', 0).set('milliseconds', 0).diff(incident.workFinish) > 0, [incident.workFinish])

    const getInitialState = useCallback(() => {
        const beforeWorkStart = incident.workStart && dayjs().diff(incident.workStart) < 0
        const afterWorkFinish = incident.workFinish && dayjs().diff(incident.workFinish) > 0

        let workFinish = dayjs()
        if (!incident.workFinish && beforeWorkStart) workFinish = dayjs(incident.workStart)
        if (isActual && afterWorkFinish) workFinish = dayjs(incident.workFinish)

        return { workFinish }
    }, [incident.workFinish, incident.workStart, isActual])

    const initialState = useMemo(() => getInitialState(), [getInitialState])

    const handleOpen = useCallback(() => {
        const formState = getInitialState()
        formRef.current.setFieldValue('workFinish', formState.workFinish)
        setOpen(true)
    }, [getInitialState])

    const handleClose = useCallback(() => {
        formRef.current.resetFields()
        setOpen(false)
    }, [])

    const handleUpdate = useCallback(async (values) => {
        const { workFinish } = values

        await updateIncident({
            variables: {
                id: incident.id,
                data: {
                    status: isActual
                        ? IncidentStatusType.NotActual
                        : IncidentStatusType.Actual,
                    workFinish,
                    sender: getClientSideSenderInfo(),
                    dv: 1,
                },
            },

        })

        analytics.track('incident_status_update', { newStatus: isActual ? 'notActual' : 'actual' })

        handleClose()
        if (isFunction(afterUpdate)) {
            await afterUpdate(workFinish)
        }
    }, [afterUpdate, handleClose, incident, isActual, updateIncident])

    const descriptionText = useMemo(() => {
        if (!isActual) {
            return ToActualMessage
        }

        if (isOverdue) {
            return ToNotActualAfterWorkFinishMessage
        }

        return ToNotActualBeforeWorkFinishMessage
    }, [ToActualMessage, ToNotActualAfterWorkFinishMessage, ToNotActualBeforeWorkFinishMessage, isActual, isOverdue])

    const finishWorkRules = useMemo(() => [
        isActual ? requiredValidator : null,
        ...getFinishWorkRules(incident, WorkFinishErrorMessage),
    ].filter(Boolean), [isActual, requiredValidator, incident, WorkFinishErrorMessage])

    const IncidentUpdateStatusModal = useMemo(() => {
        return (
            <FormWithAction initialValues={initialState} action={handleUpdate}>
                {({ isLoading, handleSave, form }) => {
                    formRef.current = form
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
                                    onClick={handleSave}
                                    disabled={isLoading}
                                />
                            )}
                        >
                            <Row gutter={MODAL_GUTTER}>
                                <Col span={24}>
                                    <Typography.Text type='secondary'>
                                        {descriptionText}
                                    </Typography.Text>
                                </Col>
                                <Col span={24}>
                                    <Form.Item
                                        label={WorkFinishFieldMessage}
                                        name='workFinish'
                                        labelCol={ITEM_LABEL_COL}
                                        rules={finishWorkRules}
                                    >
                                        <DatePicker
                                            onChange={handleChangeDate(form, 'workFinish')}
                                            showTime={SHOW_TIME_CONFIG}
                                            format='DD.MM.YYYY HH:mm'
                                            style={DATE_PICKER_STYLE}
                                            allowClear={!isActual}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Modal>
                    )
                }}
            </FormWithAction>
        )
    }, [SaveLabel, ToActualStatusTitle, ToNotActualStatusTitle, WorkFinishFieldMessage, descriptionText, finishWorkRules, handleClose, handleUpdate, initialState, isActual, open])

    return {
        handleOpen,
        IncidentUpdateStatusModal,
    }
}
