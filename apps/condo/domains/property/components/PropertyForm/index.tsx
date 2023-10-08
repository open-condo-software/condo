import React from 'react'

import { CreatePropertyForm } from './CreatePropertyForm'
import { UpdatePropertyForm } from './UpdatePropertyForm'

interface IPropertyFormProps {
    id?: string
}

export const PropertyForm: React.FC<IPropertyFormProps> = ({ id }) => {
    return ( id ? <UpdatePropertyForm id={id}/> : <CreatePropertyForm/> )
}
