import get from 'lodash/get'
import React from 'react'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { useOrganization } from '@open-condo/next/organization'


import { CreateTicketForm } from './CreateTicketForm'
import { UpdateTicketForm } from './UpdateTicketForm'

import { AccessDeniedPage } from '../../../common/components/containers/AccessDeniedPage'

interface ITicketFormProps {
    id?: string
}

export const TicketForm: React.FC<ITicketFormProps> = ({ id }) => {
    const { link } = useOrganization()
    const role = get(link, 'role')
    const hasAccess = get(role, 'canReadTickets', false) && get(role, 'canManageTickets', false)

    if (!hasAccess) {
        return <AccessDeniedPage />
    }

    return ( id ? <UpdateTicketForm id={id}/> : <CreateTicketForm/> )
}
