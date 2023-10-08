import React from 'react'

import { CreatePropertyScopeForm } from './CreatePropertyScopeForm'
import { UpdatePropertyScopeForm } from './UpdatePropertyScopeForm'

interface IPropertyScopeFormProps {
    id?: string
}

export const PropertyScopeForm: React.FC<IPropertyScopeFormProps> = ({ id }) => {
    return ( id ? <UpdatePropertyScopeForm id={id}/> : <CreatePropertyScopeForm/> )
}
