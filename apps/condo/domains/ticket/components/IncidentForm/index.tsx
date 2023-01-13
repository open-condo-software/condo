import React from 'react'
import { UpdateIncidentForm } from './UpdateIncidentForm'
import { CreateIncidentForm } from './CreateIncidentForm'


interface IIncidentFormProps {
    id?: string
}

export const IncidentForm: React.FC<IIncidentFormProps> = ({ id }) => {
    return ( id ? <UpdateIncidentForm id={id} /> : <CreateIncidentForm /> )
}
