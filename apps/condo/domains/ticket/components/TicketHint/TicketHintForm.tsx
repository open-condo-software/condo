import React from 'react'

import { UpdateTicketHintForm } from './UpdateTicketHintForm'
import { CreateTicketHintForm } from './CreateTicketHintForm'

interface ITicketFormProps {
    id?: string
}

export const TicketHintForm: React.FC<ITicketFormProps> = ({ id }) => {
    return ( id ? <UpdateTicketHintForm id={id}/> : <CreateTicketHintForm/> )
}
