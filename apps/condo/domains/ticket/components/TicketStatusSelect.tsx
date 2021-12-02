import { runMutation } from '@condo/domains/common/utils/mutations.utils'
import { Ticket, TicketStatus } from '@condo/domains/ticket/utils/clientSchema'
import {
    getTicketFormattedLastStatusUpdate,
    getTicketLabel,
    sortStatusesByType,
} from '@condo/domains/ticket/utils/helpers'
import { useIntl } from '@core/next/intl'
import styled from '@emotion/styled'
import isPropValid from '@emotion/is-prop-valid'
import { Select, Typography } from 'antd'
import get from 'lodash/get'
import React, { useCallback, useMemo } from 'react'
import { useStatusTransitions } from '../hooks/useStatusTransitions'

interface IStyledSelect {
    color: string
    backgroundColor: string
}

const StyledSelect = styled(Select, { shouldForwardProp: isPropValid })<IStyledSelect>`
  width: 100%;
  font-weight: 700;
  border-radius: 4px;
  color: ${({ color }) => color};
  background-color: ${({ backgroundColor }) => backgroundColor};
`

interface IStyledText {
    color: string
}

const StyledText = styled(Typography.Text)<IStyledText>`
  color: ${({ color }) => color};
  padding-top: 8px;
`

export const TicketStatusSelect = ({ ticket, onUpdate, organization, employee, ...props }) => {
    const intl = useIntl()
    const FormattedStatusUpdateMessage = useMemo(() => getTicketFormattedLastStatusUpdate(intl, ticket), [ticket])

    const { statuses, loading } = useStatusTransitions(get(ticket, ['status', 'id']), organization, employee)
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
        <>
            <StyledSelect
                color={color}
                backgroundColor={backgroundColor}
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
            <StyledText type="warning" color={color}>{FormattedStatusUpdateMessage}</StyledText>
        </>
    )
}
