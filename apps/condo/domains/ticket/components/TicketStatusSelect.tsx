import { runMutation } from '@condo/domains/common/utils/mutations.utils'
import { Ticket, TicketStatus } from '@condo/domains/ticket/utils/clientSchema'
import { colors } from '@condo/domains/common/constants/style'
import {
    getTicketLabel,
    sortStatusesByType,
} from '@condo/domains/ticket/utils/helpers'
import { useIntl } from '@core/next/intl'
import styled from '@emotion/styled'
import Select from '@condo/domains/common/components/antd/Select'
import get from 'lodash/get'
import React, { useCallback, useMemo } from 'react'
import { useStatusTransitions } from '../hooks/useStatusTransitions'

interface IStyledSelect {
    color: string
    backgroundColor: string
}

const StyledSelect = styled(Select)<IStyledSelect>`
  width: 100%;
  font-weight: 700;
  border-radius: 8px;
  color: ${({ color }) => color};
  background-color: ${({ backgroundColor }) => backgroundColor};

  &.ant-select-disabled {
    .ant-select-selection-item {
      color: ${({ color }) => color};
    }
  }
  
  .ant-select-arrow svg {
    fill: ${({ color }) => color};
  }
  
  &.ant-select-open .ant-select-selector .ant-select-selection-item {
    color: ${({ color }) => color};
  }
`

export const TicketStatusSelect = ({ ticket, onUpdate, organization, employee, ...props }) => {
    const intl = useIntl()

    const { statuses, loading } = useStatusTransitions(get(ticket, ['status', 'id']), organization, employee)
    const update = Ticket.useUpdate({}, () => onUpdate())

    const updateTicketStatus = useCallback((variables) => runMutation({
        action:() => update(variables, ticket),
        intl,
    }), [ticket])

    const options = useMemo(() => sortStatusesByType(statuses).map((status) => {
        const { value, label } = TicketStatus.convertGQLItemToFormSelectState(status)
        const { primary: color } = status.colors

        return (
            <Select.Option
                key={value}
                value={value}
                title={label}
                style={{ color }}
                data-cy={'ticket__status-select-option'}
            >
                {label}
            </Select.Option>
        )
    }), [statuses, ticket])

    const handleChange = useCallback(({ value }) => {
        updateTicketStatus({ status: value, statusUpdatedAt: new Date() })
    }, [ticket])

    const { primary: backgroundColor, secondary: color } = ticket.status.colors
    const selectValue = { value: ticket.status.id, label: getTicketLabel(intl, ticket) }

    return (
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
            eventName={'TicketStatusSelect'}
            {...props}
        >
            {options}
        </StyledSelect>
    )
}
