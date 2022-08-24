import React, { CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import dayjs from 'dayjs'
import { useIntl } from '@condo/next/intl'
import { isNull, get } from 'lodash'
import { Col, Row, Typography } from 'antd'
import { Gutter } from 'antd/lib/grid/row'

import DatePicker from '@condo/domains/common/components/Pickers/DatePicker'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { useTicketSettingContext } from '@condo/domains/ticket/components/TicketSettingContext'
import { getTicketDefaultDeadline } from '@condo/domains/ticket/utils/helpers'
import { humanizeDays } from '@condo/domains/common/utils/helpers'

import { TicketFormItem } from './index'

const isDateDisabled = date => date.startOf('day').isBefore(dayjs().startOf('day'))
const AUTO_DETECTED_DEADLINE_COL_STYLE = { height: '48px' }
const AUTO_DETECTED_DEADLINE_ROW_STYLE = { height: '100%' }
const TICKET_DEADLINE_FIELD_ROW_GUTTER: [Gutter, Gutter] = [0, 24]
const DATE_PICKER_STYLE = { width: '100%' }
const AUTO_COMPLETE_MESSAGE_STYLE: CSSProperties = { whiteSpace:'nowrap' }

export const TicketDeadlineField = ({ initialValues, form, isAutoDetectedValue, setIsAutoDetectedValue }) => {
    const intl = useIntl()
    const CompleteBeforeMessage = intl.formatMessage({ id: 'ticket.deadline.CompleteBefore' })
    const AutoCompletionMessage = intl.formatMessage({ id: 'ticket.deadline.AutoCompletion' })
    const TicketWithoutDeadlineMessage = intl.formatMessage({ id: 'pages.condo.ticket.WithoutDeadline' })

    const { isSmall } = useLayoutContext()
    const { ticketSetting } = useTicketSettingContext()
    const { isPaid, isEmergency, isWarranty } = form.getFieldsValue(['isPaid', 'isEmergency', 'isWarranty'])

    const isExistedTicket = get(initialValues, 'property')
    const isFirstRender = useRef<boolean>(true)

    const autoAddDays = useMemo(
        () => getTicketDefaultDeadline(ticketSetting, isPaid, isEmergency, isWarranty),
        [isEmergency, isPaid, isWarranty, ticketSetting]
    )

    const autoDeadlineValue = useMemo(() => {
        return isNull(autoAddDays) ? autoAddDays : dayjs().add(autoAddDays, 'day')
    }, [autoAddDays])

    const handleTicketDeadlineChange = useCallback(() => {
        setIsAutoDetectedValue(false)
    }, [setIsAutoDetectedValue])

    const autoDetectedLabel = useMemo(() => {
        if (!isAutoDetectedValue) return null

        return (
            <Col style={AUTO_DETECTED_DEADLINE_COL_STYLE} span={isSmall ? 24 : 11}>
                <Row justify='start' align='middle' style={AUTO_DETECTED_DEADLINE_ROW_STYLE}>
                    <Col span={24}>
                        <Typography.Text type='secondary' style={AUTO_COMPLETE_MESSAGE_STYLE}>
                            {`${AutoCompletionMessage} (+${humanizeDays(autoAddDays)})`}
                        </Typography.Text>
                    </Col>
                </Row>
            </Col>
        )
    }, [AutoCompletionMessage, autoAddDays, isAutoDetectedValue, isSmall])

    useEffect(() => {
        if (ticketSetting && isFirstRender.current) {
            if (isExistedTicket) {
                form.setFields([{ name: 'deadline', value: dayjs(get(initialValues, 'deadline')) }])
            } else {
                form.setFields([{ name: 'deadline', value: autoDeadlineValue }])
            }
            isFirstRender.current = false
        }
    }, [autoDeadlineValue, form, initialValues, isExistedTicket, ticketSetting])

    return (
        <>
            <Row align='bottom' gutter={TICKET_DEADLINE_FIELD_ROW_GUTTER} justify='space-between'>
                <Col span={isSmall ? 24 : 11}>
                    <TicketFormItem
                        label={CompleteBeforeMessage}
                        name='deadline'
                        required
                        data-cy='ticket__deadline-item'
                        hidden={isNull(autoDeadlineValue)}
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
                    isNull(autoDeadlineValue) && (
                        <Col span={24}>
                            <Typography.Text type='secondary'>{TicketWithoutDeadlineMessage}</Typography.Text>
                        </Col>
                    )
                }
                {
                    !isNull(autoDeadlineValue) && isAutoDetectedValue && autoDetectedLabel
                }
            </Row>
        </>
    )
}
