import { TicketStatusTypeType } from '@app/condo/schema'
import styled from '@emotion/styled'
import { Dayjs } from 'dayjs'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import isFunction from 'lodash/isFunction'
import React, { useCallback, useMemo, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'

import Select from '@condo/domains/common/components/antd/Select'
import { transitions, colors } from '@condo/domains/common/constants/style'
import { useNotificationMessages } from '@condo/domains/common/hooks/useNotificationMessages'
import { runMutation } from '@condo/domains/common/utils/mutations.utils'
import { useTicketCancelModal } from '@condo/domains/ticket/hooks/useTicketCancelModal'
import { useTicketDeferModal } from '@condo/domains/ticket/hooks/useTicketDeferModal'
import { Ticket, TicketStatus } from '@condo/domains/ticket/utils/clientSchema'
import { getTicketLabel, sortStatusesByType } from '@condo/domains/ticket/utils/helpers'

import { useStatusTransitions } from '../hooks/useStatusTransitions'


interface IStatusSelect {
    color: string
    backgroundColor: string
    minWidth?: number
}

export const StatusSelect = styled(Select)<IStatusSelect>`
  min-width: ${({ minWidth }) => minWidth ? `${minWidth}px` : '175px'};
  font-weight: 700;
  border-radius: 8px;
  color: ${({ color }) => color};
  background-color: ${({ backgroundColor }) => backgroundColor};
  transition: ${transitions.easeInOut};

  &.ant-select-disabled .ant-select-selector .ant-select-selection-item {
    color: ${({ color }) => color};
  }

  &.ant-select-open .ant-select-selector .ant-select-selection-item {
    color: ${({ color }) => color};
  }

  .ant-select-selector .ant-select-selection-item {
    font-weight: 600;
    color: ${colors.white};
    transition: ${transitions.easeInOut};
  }
  
  .ant-select-arrow svg {
    fill: ${({ color }) => color};
    transition: ${transitions.easeInOut};
  }
`

export const TicketStatusSelect = ({ ticket, onUpdate, organization, employee, ...props }) => {
    const intl = useIntl()

    const { getSuccessfulChangeNotification } = useNotificationMessages()

    const { statuses, loading } = useStatusTransitions(get(ticket, ['status', 'id']), organization, employee)
    const canManageTickets = useMemo(() => get(employee, ['role', 'canManageTickets'], false), [employee])
    const [isUpdating, setUpdating] = useState(false)
    const handleUpdate = useCallback(() => {
        if (isFunction(onUpdate)) onUpdate()
        setUpdating(false)
    }, [onUpdate, setUpdating])
    const update = Ticket.useUpdate({}, handleUpdate)

    const updateTicketStatus = useCallback((variables) => runMutation({
        action:() => update(variables, ticket),
        intl,
        OnCompletedMsg: getSuccessfulChangeNotification,
    }), [getSuccessfulChangeNotification, ticket])

    const updateTicket = useCallback((value) => {
        setUpdating(true)
        updateTicketStatus({ status: { connect: { id: value } }, statusUpdatedAt: new Date() })
    }, [updateTicketStatus])

    const updateDeferredTicket = useCallback((statusDeferredId: string, deferredDate: Dayjs) => {
        setUpdating(true)
        updateTicketStatus({
            status: { connect: { id: statusDeferredId } },
            statusUpdatedAt: new Date(),
            deferredUntil: deferredDate.toISOString(),
        })
    }, [updateTicketStatus])

    const { cancelTicketModal, openModal: openCancelModal } = useTicketCancelModal(updateTicket)
    const { deferTicketModal, openModal: openTicketDeferModal } = useTicketDeferModal(updateDeferredTicket)

    const options = useMemo(() => sortStatusesByType(statuses).map((status) => {
        const { value, label } = TicketStatus.convertGQLItemToFormSelectState(status)
        const { primary: color } = status.colors

        return (
            <Select.Option
                key={value}
                value={value}
                title={label}
                style={{ color }}
                data-cy='ticket__status-select-option'
            >
                {label}
            </Select.Option>
        )
    }), [statuses, ticket])

    const handleChange = useCallback(({ value }) => {
        const selectedStatus = statuses.find((status) => get(status, 'id') === value)
        if (selectedStatus.type === TicketStatusTypeType.Canceled) {
            openCancelModal(value)
        } else if (selectedStatus.type === TicketStatusTypeType.Deferred) {
            openTicketDeferModal(value)
        } else {
            updateTicket(value)
        }
    }, [ticket, statuses, updateTicket, openCancelModal])

    const { primary: backgroundColor, secondary: color } = ticket.status.colors
    const selectValue = useMemo(
        () => ({ value: get(ticket, 'status.id'), label: getTicketLabel(intl, ticket) }),
        [get(ticket, 'status.id'), getTicketLabel, intl, ticket]
    )

    const isLoading = loading || isUpdating
    const isDisabled = isEmpty(statuses) || isLoading || !canManageTickets

    return (
        <>
            <StatusSelect
                color={color}
                backgroundColor={backgroundColor}
                disabled={isDisabled}
                loading={isLoading}
                onChange={handleChange}
                defaultValue={selectValue}
                value={selectValue}
                bordered={false}
                labelInValue
                eventName='TicketStatusSelect'
                {...props}
            >
                {options}
            </StatusSelect>
            {cancelTicketModal}
            {deferTicketModal}
        </>
    )
}
