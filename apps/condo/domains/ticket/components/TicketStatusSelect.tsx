// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { runMutation } from '@condo/domains/common/utils/mutations.utils'
import { Ticket, TicketStatus } from '@condo/domains/ticket/utils/clientSchema'
import {
    getTicketFormattedLastStatusUpdate,
    getTicketLabel,
    sortStatusesByType,
} from '@condo/domains/ticket/utils/helpers'
import { useIntl } from '@core/next/intl'
import styled from '@emotion/styled'
import { Select, Space, Typography } from 'antd'
import get from 'lodash/get'
import React, { useCallback, useMemo } from 'react'
import { useStatusTransitions } from '../hooks/useStatusTransitions'

const StyledSelect = styled(Select)`
  width: 100%;
  font-weight: 700;
  border-radius: 4px;
`

export const TicketStatusSelect = ({ ticket, onUpdate, ...props }) => {
    const intl = useIntl()
    const FormattedStatusUpdateMessage = useMemo(() => getTicketFormattedLastStatusUpdate(intl, ticket), [ticket])

    const { statuses, loading } = useStatusTransitions(get(ticket, ['status', 'id']))
    const update = Ticket.useUpdate({}, () => onUpdate())

    const updateTicketStatus = useCallback((variables) => runMutation({
        action:() => update(variables, ticket),
        intl,
    }), [ticket])

    const options = useMemo(() => sortStatusesByType(statuses).map((status) => {
        const { value, label } = TicketStatus.convertGQLItemToFormSelectState(status)
        const { primary: color } = status.colors

        return (<Select.Option key={value} value={value} title={label} style={{ color }}>{label}</Select.Option>)
    }), [statuses, ticket])

    const handleChange = useCallback(({ value }) => {
        updateTicketStatus({ status: value, statusUpdatedAt: new Date() })
    }, [ticket])

    const { primary: color, secondary: backgroundColor } = ticket.status.colors
    const selectValue = { value: ticket.status.id, label: getTicketLabel(intl, ticket) }

    return (
        <Space size={8} direction={'vertical'} align={'end'}>
            <StyledSelect
                style={{
                    color,
                    backgroundColor,
                }}
                disabled={!statuses.length}
                loading={loading}
                onChange={handleChange}
                defaultValue={selectValue}
                value={selectValue}
                bordered={false}
                labelInValue
                {...props}
            >
                {options}
            </StyledSelect>
            <Typography.Text type="warning" style={{ color }}>{FormattedStatusUpdateMessage}</Typography.Text>
        </Space>
    )
}
