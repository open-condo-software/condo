import React, { CSSProperties, useCallback, useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import get from 'lodash/get'
import { Col, Row, Typography } from 'antd'
import { Gutter } from 'antd/lib/grid/row'
import DatePicker from '@condo/domains/common/components/Pickers/DatePicker'

import { useIntl } from '@condo/next/intl'
import { TicketFormItem, useTicketSettingContext } from './index'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { useOrganization } from '@condo/next/organization'
import { TicketOrganizationSetting as TicketSetting } from '@condo/domains/ticket/utils/clientSchema'

const INITIAL_DEADLINE_VALUE = dayjs().add(8, 'day')
const isDateDisabled = date => date.startOf('day').isBefore(dayjs().startOf('day'))
const AUTO_DETECTED_DEADLINE_COL_STYLE = { height: '48px' }
const AUTO_DETECTED_DEADLINE_ROW_STYLE = { height: '100%' }
const TICKET_DEADLINE_FIELD_ROW_GUTTER: [Gutter, Gutter] = [0, 24]
const DATE_PICKER_STYLE = { width: '100%' }
const AUTO_COMPLETE_MESSAGE_STYLE: CSSProperties = { whiteSpace:'nowrap' }

export const TicketDeadlineField = ({ initialValues, form }) => {
    const intl = useIntl()
    const CompleteBeforeMessage = intl.formatMessage({ id: 'ticket.deadline.CompleteBefore' })
    const AutoCompletionMessage = intl.formatMessage({ id: 'ticket.deadline.AutoCompletion' })

    const { isSmall } = useLayoutContext()
    const { ticketSetting } = useTicketSettingContext()

    const isExistedTicket = get(initialValues, 'property')

    const isPaid = form.getFieldValue('isPaid')
    const isEmergency = form.getFieldValue('isEmergency')
    const isWarranty = form.getFieldValue('isWarranty')

    const initialDeadlineValue = useMemo(() => {
        if (!ticketSetting) return null

        let addDays: number | null = get(ticketSetting, 'defaultDeadline')
        if (isWarranty) addDays = get(ticketSetting, 'warrantyDeadline')
        if (isPaid) addDays = get(ticketSetting, 'paidDeadline')
        if (isEmergency) addDays = get(ticketSetting, 'emergencyDeadline')

        if (addDays === null) return null
        return dayjs().add(addDays, 'day')
    }, [isEmergency, isPaid, isWarranty, ticketSetting])

    useEffect(() => {
        // form.resetFields(['deadline'])
        form.setFields([{ name: 'deadline', value: initialDeadlineValue }])
    }, [form, initialDeadlineValue])

    const [isAutoDetectedValue, setIsAutoDetectedValue] = useState<boolean>(!isExistedTicket)

    const handleTicketDeadlineChange = useCallback(() => {
        setIsAutoDetectedValue(false)
    }, [])

    return (
        <>
            <Row align='bottom' gutter={TICKET_DEADLINE_FIELD_ROW_GUTTER} justify='space-between'>
                <Col span={isSmall ? 24 : 11}>
                    <TicketFormItem
                        label={CompleteBeforeMessage}
                        name='deadline'
                        required
                        initialValue={INITIAL_DEADLINE_VALUE}
                        data-cy='ticket__deadline-item'
                        hidden={!initialDeadlineValue}
                    >
                        <DatePicker
                            format='DD MMMM YYYY'
                            onChange={handleTicketDeadlineChange}
                            disabledDate={isDateDisabled}
                            disabled={!ticketSetting}
                            style={DATE_PICKER_STYLE}
                            allowClear={false}
                        />
                    </TicketFormItem>
                </Col>
                {
                    !initialDeadlineValue && (
                        <Col span={24}>
                            <Typography.Text type='secondary'>У данного типа заявки нет выбора срока выполнения</Typography.Text>
                        </Col>
                    )
                }
                {
                    isAutoDetectedValue && (
                        <Col style={AUTO_DETECTED_DEADLINE_COL_STYLE} span={isSmall ? 24 : 11}>
                            <Row justify='start' align='middle' style={AUTO_DETECTED_DEADLINE_ROW_STYLE}>
                                <Col span={24}>
                                    <Typography.Text type='secondary' style={AUTO_COMPLETE_MESSAGE_STYLE}>
                                        {AutoCompletionMessage}
                                    </Typography.Text>
                                </Col>
                            </Row>
                        </Col>
                    )
                }
            </Row>
        </>
    )
}
