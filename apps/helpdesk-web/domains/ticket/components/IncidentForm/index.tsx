import React from 'react'

import { CreateIncidentForm } from './CreateIncidentForm'
import { UpdateIncidentForm } from './UpdateIncidentForm'


interface IIncidentFormProps {
    id?: string
}

export const IncidentForm: React.FC<IIncidentFormProps> = ({ id }) => {
    return ( id ? <UpdateIncidentForm id={id} /> : <CreateIncidentForm /> )
}
