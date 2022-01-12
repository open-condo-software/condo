import React from 'react'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { UpdateTicketForm } from './UpdateTicketForm'
import { CreateTicketForm } from './CreateTicketForm'

interface ITicketFormProps {
    id?: string
}

export const TicketForm: React.FC<ITicketFormProps> = ({ id }) => {
    return id ? <UpdateTicketForm id={id} /> : <CreateTicketForm />
}
