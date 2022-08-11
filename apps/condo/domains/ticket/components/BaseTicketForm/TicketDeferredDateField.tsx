import { useIntl } from '@condo/next/intl'
import { Col, DatePicker, Row } from 'antd'
import { TicketFormItem } from './index'
import React, { useCallback } from 'react'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import dayjs from 'dayjs'
import { Gutter } from 'antd/lib/grid/row'

const minDate = dayjs().endOf('day')
const maxDate = dayjs().add(365, 'days').endOf('day')
const DATE_PICKER_STYLE = { width: '100%' }
const TICKET_DEADLINE_FIELD_ROW_GUTTER: [Gutter, Gutter] = [0, 24]

export const TicketDeferredDateField = () => {
    const intl = useIntl()
    const DeferredUntilMessage = intl.formatMessage({ id: 'pages.condo.ticket.id.TicketDefer.DeferredDate.field' })

    const { isSmall } = useLayoutContext()

    const handleDisabledDate = useCallback((current) => current < minDate || current > maxDate, [])

    return (
        <Row align={'bottom'} gutter={TICKET_DEADLINE_FIELD_ROW_GUTTER} justify={'space-between'}>
            <Col span={isSmall ? 24 : 11}>
                <TicketFormItem
                    label={DeferredUntilMessage}
                    name='deferredUntil'
                    required
                    data-cy={'ticket__deferredUntil-item'}
                >
                    <DatePicker
                        format='DD MMMM YYYY'
                        disabledDate={handleDisabledDate}
                        style={DATE_PICKER_STYLE}
                        allowClear={false}
                    />
                </TicketFormItem>
            </Col>
        </Row>
    )
}