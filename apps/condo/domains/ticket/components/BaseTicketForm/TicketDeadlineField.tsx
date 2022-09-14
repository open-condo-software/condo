import React, { CSSProperties, useCallback, useEffect, useMemo } from 'react'
import dayjs from 'dayjs'
import { useIntl } from '@condo/next/intl'
import get from 'lodash/get'
import isNull from 'lodash/isNull'
import { Col, Row, Typography } from 'antd'
import { Gutter } from 'antd/lib/grid/row'

import DatePicker from '@condo/domains/common/components/Pickers/DatePicker'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { useTicketFormContext } from '@condo/domains/ticket/components/TicketForm/TicketFormContext'
import { convertDurationToDays, getTicketDefaultDeadline } from '@condo/domains/ticket/utils/helpers'
import { DEFAULT_TICKET_DEADLINE_DURATION } from '@condo/domains/ticket/constants/common'

import { TicketFormItem } from './index'

const isDateDisabled = date => date.startOf('day').isBefore(dayjs().startOf('day'))
const AUTO_DETECTED_DEADLINE_COL_STYLE = { height: '48px' }
const AUTO_DETECTED_DEADLINE_ROW_STYLE = { height: '100%' }
const TICKET_DEADLINE_FIELD_ROW_GUTTER: [Gutter, Gutter] = [0, 24]
const DATE_PICKER_STYLE = { width: '100%' }
const AUTO_COMPLETE_MESSAGE_STYLE: CSSProperties = { whiteSpace:'nowrap' }

const DEFAULT_DEADLINE_VALUE = dayjs().add(convertDurationToDays(DEFAULT_TICKET_DEADLINE_DURATION), 'days')

export const TicketDeadlineField = ({ initialValues, form }) => {
    const intl = useIntl()
    const CompleteBeforeMessage = intl.formatMessage({ id: 'ticket.deadline.CompleteBefore' })
    const AutoCompletionMessage = intl.formatMessage({ id: 'ticket.deadline.AutoCompletion' })
    const AutoCompletionTodayMessage = intl.formatMessage({ id: 'ticket.deadline.AutoCompletion.today' })
    const TicketWithoutDeadlineMessage = intl.formatMessage({ id: 'pages.condo.ticket.WithoutDeadline' })

    const { isSmall } = useLayoutContext()
    const COL_SPAN = useMemo(() => isSmall ? 24 : 11, [isSmall])

    const { ticketSetting, isAutoDetectedDeadlineValue, setIsAutoDetectedDeadlineValue, isExistedTicket } = useTicketFormContext()
    const { isPaid, isEmergency, isWarranty } = form.getFieldsValue(['isPaid', 'isEmergency', 'isWarranty'])
    const isTouchedTicketType = form.isFieldsTouched(['isPaid', 'isEmergency', 'isWarranty'])

    const autoAddDays: null | number = useMemo(
        () => getTicketDefaultDeadline(ticketSetting, isPaid, isEmergency, isWarranty),
        [isEmergency, isPaid, isWarranty, ticketSetting]
    )

    const autoDeadlineValue = useMemo(() => {
        return isNull(autoAddDays) ? autoAddDays : dayjs().add(autoAddDays, 'day')
    }, [autoAddDays])

    const initialDeadline = get(initialValues, 'deadline', null)
    const isShowDeadline = isExistedTicket && !isTouchedTicketType
        ? !(isNull(autoDeadlineValue) && isNull(initialDeadline))
        : !isNull(autoDeadlineValue)
    const isShowAutoDeadlineLabel = !isNull(autoDeadlineValue) && isAutoDetectedDeadlineValue
    const isShowHiddenLabel = initialDeadline ? isTouchedTicketType && isNull(autoDeadlineValue) : isNull(autoDeadlineValue)

    const handleTicketDeadlineChange = useCallback(() => {
        setIsAutoDetectedDeadlineValue(false)
    }, [setIsAutoDetectedDeadlineValue])

    const autoDetectedLabel = useMemo(() => {
        if (!isAutoDetectedDeadlineValue || isNull(autoAddDays)) return null

        const DaysMessage = intl.formatMessage({ id: 'DaysShort' }, { days: autoAddDays })

        return (
            <Col style={AUTO_DETECTED_DEADLINE_COL_STYLE} span={isSmall ? 24 : 11}>
                <Row justify='start' align='middle' style={AUTO_DETECTED_DEADLINE_ROW_STYLE}>
                    <Col span={24}>
                        <Typography.Text type='secondary' style={AUTO_COMPLETE_MESSAGE_STYLE}>
                            {
                                autoAddDays === 0
                                    ? AutoCompletionTodayMessage
                                    : `${AutoCompletionMessage} (+${DaysMessage})`
                            }
                        </Typography.Text>
                    </Col>
                </Row>
            </Col>
        )
    }, [AutoCompletionMessage, AutoCompletionTodayMessage, autoAddDays, intl, isAutoDetectedDeadlineValue, isSmall])

    useEffect(() => {
        if (isExistedTicket) {
            form.setFields([{ name: 'deadline', value: isNull(initialDeadline) ? initialDeadline : dayjs(initialDeadline) }])
            setIsAutoDetectedDeadlineValue(false)
        } else {
            form.setFields([{ name: 'deadline', value: autoDeadlineValue }])
        }
    }, [isExistedTicket, initialDeadline])

    useEffect(() => {
        if (!isExistedTicket || isTouchedTicketType) {
            form.setFields([{ name: 'deadline', value: autoDeadlineValue }])
        }
    }, [isExistedTicket, isTouchedTicketType, ticketSetting])

    return (
        <>
            <Row align='bottom' gutter={TICKET_DEADLINE_FIELD_ROW_GUTTER} justify='space-between'>
                <Col span={COL_SPAN}>
                    <TicketFormItem
                        label={CompleteBeforeMessage}
                        name='deadline'
                        required
                        data-cy='ticket__deadline-item'
                        hidden={!isShowDeadline}
                    >
                        <DatePicker
                            format='DD MMMM YYYY'
                            onChange={handleTicketDeadlineChange}
                            disabledDate={isDateDisabled}
                            style={DATE_PICKER_STYLE}
                            allowClear={false}
                        />
                    </TicketFormItem>
                </Col>
                {
                    isShowHiddenLabel && (
                        <Col span={24}>
                            <Typography.Text type='secondary'>{TicketWithoutDeadlineMessage}</Typography.Text>
                        </Col>
                    )
                }
                {
                    isShowAutoDeadlineLabel && autoDetectedLabel
                }
            </Row>
        </>
    )
}
