import React from 'react'

import { CreatePropertyForm } from './CreatePropertyForm'
import { UpdatePropertyForm } from './UpdatePropertyForm'

interface IPropertyFormProps {
    id?: string
    next?: string
}

export const PropertyForm: React.FC<IPropertyFormProps> = ({ id, next }) => {
    return (id ? <UpdatePropertyForm next={next} id={id}/> : <CreatePropertyForm next={next} /> )
}
