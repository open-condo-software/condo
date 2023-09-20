import React from 'react'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { CreateTicketForm } from './CreateTicketForm'
import { UpdateTicketForm } from './UpdateTicketForm'

interface ITicketFormProps {
    id?: string
}

export const TicketForm: React.FC<ITicketFormProps> = ({ id }) => {
    return ( id ? <UpdateTicketForm id={id}/> : <CreateTicketForm/> )
}
