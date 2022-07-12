import React, { useCallback, useMemo, useState } from 'react'
import isFunction from 'lodash/isFunction'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import styled from '@emotion/styled'

import { useIntl } from '@core/next/intl'

import { runMutation } from '@condo/domains/common/utils/mutations.utils'
import { Ticket, TicketStatus } from '@condo/domains/ticket/utils/clientSchema'
import { getTicketLabel, sortStatusesByType } from '@condo/domains/ticket/utils/helpers'
import Select from '@condo/domains/common/components/antd/Select'

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

export const TicketStatusSelect = ({ ticket, onUpdate, organization, employee, loading: parentLoading, ...props }) => {
    const intl = useIntl()

    const { statuses, loading } = useStatusTransitions(get(ticket, ['status', 'id']), organization, employee)
    const [isUpdating, setUpdating] = useState(false)
    const handleUpdate = useCallback(() => {
        if (isFunction(onUpdate)) onUpdate()
        setUpdating(false)
    }, [onUpdate, setUpdating])
    const update = Ticket.useUpdate({}, handleUpdate)

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
        setUpdating(true)
        updateTicketStatus({ status: { connect: { id: value } }, statusUpdatedAt: new Date() })
    }, [ticket, setUpdating])

    const { primary: backgroundColor, secondary: color } = ticket.status.colors
    const selectValue = useMemo(
        () => ({ value: ticket.status.id, label: getTicketLabel(intl, ticket) }),
        [ticket.status.id, getTicketLabel, intl, ticket]
    )

    const isLoading = parentLoading || loading || isUpdating
    const isDisabled = isEmpty(statuses) || isLoading

    return (
        <StyledSelect
            color={color}
            backgroundColor={backgroundColor}
            disabled={isDisabled}
            loading={isLoading}
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
