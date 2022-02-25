import React from 'react'
import { UpdatePropertyForm } from './UpdatePropertyForm'
import { CreatePropertyForm } from './CreatePropertyForm'

interface IPropertyFormProps {
    id?: string
}

export const PropertyForm: React.FC<IPropertyFormProps> = ({ id }) => {
    return ( id ? <UpdatePropertyForm id={id}/> : <CreatePropertyForm/> )
}
