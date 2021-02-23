import React from 'react'
import { useOrganization } from '@core/next/organization'
import { Typography } from 'antd'
import { useIntl } from '@core/next/intl'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { useObject, useUpdate, convertGQLItemToFormState } from '../../schema/Ticket.uistate'
import { BaseTicketForm } from './BaseTicketForm'

interface IUpdateTicketForm {
    id: string
}

export const UpdateTicketForm:React.FunctionComponent<IUpdateTicketForm> = ({ id }) => {
    const intl = useIntl()
    const LoadingMessage = intl.formatMessage({ id: 'Loading' })

    const { organization } = useOrganization()
    const { obj, refetch, loading, error } = useObject({ where: { id } }, false)

    const action = useUpdate({}, refetch)
    const updateAction = (value) => action(value, obj)

    if (error || loading) {
        return (
            <>
                {(loading) ? <Typography.Title>{LoadingMessage}</Typography.Title> : null}
                {(error) ? <Typography.Title>{error}</Typography.Title> : null}
            </>
        )
    }

    return (
        <BaseTicketForm
            action={updateAction}
            initialValues={convertGQLItemToFormState(obj)}
            organization={organization}
        />
    )
}
