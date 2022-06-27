import React from 'react'

import { UpdateTicketPropertyHintForm } from './UpdateTicketPropertyHintForm'
import { CreateTicketPropertyHintForm } from './CreateTicketPropertyHintForm'

interface ITicketFormProps {
    id?: string
}

export const TicketPropertyHintForm: React.FC<ITicketFormProps> = ({ id }) => {
    return ( id ? <UpdateTicketPropertyHintForm id={id}/> : <CreateTicketPropertyHintForm/> )
}
