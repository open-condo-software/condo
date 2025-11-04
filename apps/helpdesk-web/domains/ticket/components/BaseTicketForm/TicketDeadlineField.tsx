import { Col, Row, Typography } from 'antd'
import { Gutter } from 'antd/lib/grid/row'
import dayjs from 'dayjs'
import get from 'lodash/get'
import isNull from 'lodash/isNull'
import React, { CSSProperties, useCallback, useEffect, useMemo } from 'react'

import { QuestionCircle, Settings } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Space, Tooltip } from '@open-condo/ui'

import { FormItemTooltipWrapper } from '@condo/domains/common/components/Form/FormItemTooltipWrapper'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { LinkWithIcon } from '@condo/domains/common/components/LinkWithIcon'
import DatePicker from '@condo/domains/common/components/Pickers/DatePicker'
import { useTicketFormContext } from '@condo/domains/ticket/components/TicketForm/TicketFormContext'
import { getTicketDefaultDeadline } from '@condo/domains/ticket/utils/helpers'


import { TicketFormItem } from './index'


const isDateDisabled = date => date.startOf('day').isBefore(dayjs().startOf('day'))
const TICKET_DEADLINE_FIELD_ROW_GUTTER: [Gutter, Gutter] = [0, 8]
const DATE_PICKER_STYLE = { width: '100%' }
const AUTO_COMPLETE_MESSAGE_STYLE: CSSProperties = { whiteSpace:'nowrap' }

export const TicketDeadlineField = ({ initialValues, form }) => {
    const intl = useIntl()
    const CompleteBeforeMessage = intl.formatMessage({ id: 'ticket.deadline.CompleteBefore' })
    const AutoCompletionMessage = intl.formatMessage({ id: 'ticket.deadline.AutoCompletion' })
    const AutoCompletionTodayMessage = intl.formatMessage({ id: 'ticket.deadline.AutoCompletion.today' })
    const TicketWithoutDeadlineMessage = intl.formatMessage({ id: 'pages.condo.ticket.WithoutDeadline' })
    const TicketDeadlineTooltipTitle = intl.formatMessage({ id: 'ticket.deadline.tooltip.title' })
    const TicketDeadlineTooltipLink = intl.formatMessage({ id: 'ticket.deadline.tooltip.link' })

    const { breakpoints } = useLayoutContext()
    const COL_SPAN = useMemo(() => !breakpoints.TABLET_LARGE ? 24 : 11, [breakpoints.TABLET_LARGE])

    const { ticketSetting, isAutoDetectedDeadlineValue, setIsAutoDetectedDeadlineValue, isExistedTicket } = useTicketFormContext()
    const { isPayable, isEmergency, isWarranty } = form.getFieldsValue(['isPayable', 'isEmergency', 'isWarranty'])
    const isTouchedTicketType = form.isFieldsTouched(['isPayable', 'isEmergency', 'isWarranty'])

    const autoAddDays: null | number = useMemo(
        () => getTicketDefaultDeadline(ticketSetting, isPayable, isEmergency, isWarranty),
        [isEmergency, isPayable, isWarranty, ticketSetting]
    )

    const createdAt = get(initialValues, 'createdAt', null)
    const ticketSettingId = get(ticketSetting, 'id', null)

    const autoDeadlineValue = useMemo(() => {
        const startDate = createdAt ? dayjs(createdAt) : dayjs()
        return isNull(autoAddDays) ? autoAddDays : startDate.add(autoAddDays, 'day')
    }, [autoAddDays, createdAt])

    const initialDeadline = get(initialValues, 'deadline', null)
    const initialDeadlineInString = initialDeadline && dayjs(initialDeadline).toISOString()
    const isShowDeadline = isExistedTicket && !isTouchedTicketType
        ? !(isNull(autoDeadlineValue) && isNull(initialDeadlineInString))
        : !isNull(autoDeadlineValue)
    const isShowAutoDeadlineLabel = !isNull(autoDeadlineValue) && isAutoDetectedDeadlineValue
    const isShowHiddenLabel = initialDeadlineInString ? isTouchedTicketType && isNull(autoDeadlineValue) : isNull(autoDeadlineValue)

    const handleTicketDeadlineChange = useCallback(() => {
        setIsAutoDetectedDeadlineValue(false)
    }, [setIsAutoDetectedDeadlineValue])

    const autoDetectedLabel = useMemo(() => {
        if (!isAutoDetectedDeadlineValue || isNull(autoAddDays)) return null

        const DaysMessage = intl.formatMessage({ id: 'DaysShort' }, { days: autoAddDays })

        return (
            <Col span={24}>
                <Row justify='start' align='middle'>
                    <Col span={24}>
                        <Tooltip
                            title={(
                                <FormItemTooltipWrapper>
                                    <Typography.Text>
                                        {TicketDeadlineTooltipTitle}
                                    </Typography.Text>
                                    <LinkWithIcon
                                        title={TicketDeadlineTooltipLink}
                                        href='/settings/ticketDeadlines'
                                        target='_blank'
                                        PostfixIcon={Settings}
                                        size='medium'
                                    />
                                </FormItemTooltipWrapper>
                            )}
                        >
                            <Typography.Text type='secondary' style={AUTO_COMPLETE_MESSAGE_STYLE}>
                                <Space size={8} align='center'>
                                    {
                                        autoAddDays === 0
                                            ? AutoCompletionTodayMessage
                                            : `${AutoCompletionMessage} (+${DaysMessage})`
                                    }
                                    <QuestionCircle size='small' />
                                </Space>
                            </Typography.Text>
                        </Tooltip>
                    </Col>
                </Row>
            </Col>
        )
    }, [AutoCompletionMessage, AutoCompletionTodayMessage, autoAddDays, intl, isAutoDetectedDeadlineValue, breakpoints.TABLET_LARGE])

    useEffect(() => {
        if (!isExistedTicket) {
            form.setFields([{ name: 'deadline', value: autoDeadlineValue }])
            setIsAutoDetectedDeadlineValue(true)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isExistedTicket, ticketSettingId])

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
