import { useApolloClient } from '@apollo/client'
import { useUpdateTicketMutation } from '@app/condo/gql'
import { TicketStatusTypeType } from '@app/condo/schema'
import { notification } from 'antd'
import { Dayjs } from 'dayjs'
import isEmpty from 'lodash/isEmpty'
import isFunction from 'lodash/isFunction'
import React, { useCallback, useMemo, useState } from 'react'

import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { useIntl } from '@open-condo/next/intl'

import Select from '@condo/domains/common/components/antd/Select'
import { StatusSelect } from '@condo/domains/common/components/StatusSelect'
import { useNotificationMessages } from '@condo/domains/common/hooks/useNotificationMessages'
import { useTicketCancelModal } from '@condo/domains/ticket/hooks/useTicketCancelModal'
import { useTicketDeferModal } from '@condo/domains/ticket/hooks/useTicketDeferModal'
import { getTicketLabel, sortStatusesByType } from '@condo/domains/ticket/utils/helpers'

import { useStatusTransitions } from '../hooks/useStatusTransitions'


export const TicketStatusSelect = ({ ticket, onUpdate, organization, employee, ...props }) => {
    const intl = useIntl()

    const { getSuccessfulChangeNotification } = useNotificationMessages()
    const client = useApolloClient()

    const ticketId = ticket?.id || null
    const { statuses, loading } = useStatusTransitions(ticket?.status?.id, organization, employee)
    const canManageTickets = useMemo(() => employee?.role?.canManageTickets || false, [employee])
    const [isUpdating, setUpdating] = useState(false)
    const handleUpdate = useCallback(() => {
        if (isFunction(onUpdate)) onUpdate()
        setUpdating(false)
    }, [onUpdate, setUpdating])
    const [updateTicketMutation] = useUpdateTicketMutation({
        onCompleted: () => {
            handleUpdate()
            notification.success(getSuccessfulChangeNotification())
        },
    })

    const updateTicket = useCallback(async (value) => {
        setUpdating(true)
        await updateTicketMutation({
            variables: {
                id: ticketId,
                data: {
                    status: { connect: { id: value } },
                    statusUpdatedAt: new Date() as unknown as string,
                    sender: getClientSideSenderInfo(),
                    dv: 1,
                },
            },
        })
    }, [ticketId, updateTicketMutation])

    const updateDeferredTicket = useCallback(async (statusDeferredId: string, deferredDate: Dayjs) => {
        setUpdating(true)
        await updateTicketMutation({
            variables: {
                id: ticketId,
                data: {
                    status: { connect: { id: statusDeferredId } },
                    deferredUntil: deferredDate.toISOString(),
                    statusUpdatedAt: new Date() as unknown as string,
                    sender: getClientSideSenderInfo(),
                    dv: 1,
                },
            },

        })
    }, [ticketId, updateTicketMutation])

    const { cancelTicketModal, openModal: openCancelModal } = useTicketCancelModal(updateTicket, ticketId)
    const { deferTicketModal, openModal: openTicketDeferModal } = useTicketDeferModal(updateDeferredTicket)

    const options = useMemo(() => sortStatusesByType(statuses).map((status) => {
        const { name: label, id: value } = status
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

    const handleChange = useCallback(({ value }: any) => {
        const selectedStatus = statuses.find((status) => status.id === value)
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
        () => ({ value: ticket?.status?.id, label: getTicketLabel(intl, ticket) }),
        [getTicketLabel, ticket?.status?.id, intl, ticket]
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
                {...props}
            >
                {options}
            </StatusSelect>
            {cancelTicketModal}
            {deferTicketModal}
        </>
    )
}
