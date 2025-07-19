import React from 'react'

import { CreateTicketPropertyHintForm } from './CreateTicketPropertyHintForm'
import { UpdateTicketPropertyHintForm } from './UpdateTicketPropertyHintForm'

interface ITicketFormProps {
    id?: string
}

export const TicketPropertyHintForm: React.FC<ITicketFormProps> = ({ id }) => {
    return ( id ? <UpdateTicketPropertyHintForm id={id}/> : <CreateTicketPropertyHintForm/> )
}
