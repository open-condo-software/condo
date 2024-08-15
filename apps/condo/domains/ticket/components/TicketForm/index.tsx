import React from 'react'

import { CreateTicketForm } from './CreateTicketForm'
import { UpdateTicketForm } from './UpdateTicketForm'


interface ITicketFormProps {
    id?: string
}

export const TicketForm: React.FC<ITicketFormProps> = ({ id }) => {
    return ( id ? <UpdateTicketForm id={id}/> : <CreateTicketForm/> )
}
