import { useApolloClient } from '@apollo/client'
import { TicketStatusTypeType } from '@app/condo/schema'
import { Dayjs } from 'dayjs'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import isFunction from 'lodash/isFunction'
import React, { useCallback, useMemo, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'

import Select from '@condo/domains/common/components/antd/Select'
import { StatusSelect } from '@condo/domains/common/components/StatusSelect'
import { useNotificationMessages } from '@condo/domains/common/hooks/useNotificationMessages'
import { runMutation } from '@condo/domains/common/utils/mutations.utils'
import { useTicketCancelModal } from '@condo/domains/ticket/hooks/useTicketCancelModal'
import { useTicketDeferModal } from '@condo/domains/ticket/hooks/useTicketDeferModal'
import { Ticket, TicketStatus } from '@condo/domains/ticket/utils/clientSchema'
import { getTicketLabel, sortStatusesByType } from '@condo/domains/ticket/utils/helpers'

import { useStatusTransitions } from '../hooks/useStatusTransitions'


export const TicketStatusSelect = ({ ticket, onUpdate, organization, employee, ...props }) => {
    const intl = useIntl()

    const { getSuccessfulChangeNotification } = useNotificationMessages()

    const client = useApolloClient()
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

    const ticketId = get(ticket, 'id')
    const { cancelTicketModal, openModal: openCancelModal } = useTicketCancelModal(updateTicket, ticketId)
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

        client.cache.evict({ id: 'ROOT_QUERY', fieldName: '_allTicketsMeta' })
    }, [statuses, client.cache, openCancelModal, openTicketDeferModal, updateTicket])

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
