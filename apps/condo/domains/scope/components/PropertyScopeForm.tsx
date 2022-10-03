import React from 'react'

import { UpdatePropertyScopeForm } from './UpdatePropertyScopeForm'
import { CreateTicketPropertyHintForm } from './CreatePropertyScopeForm'

interface IPropertyScopeFormProps {
    id?: string
}

export const PropertyScopeForm: React.FC<IPropertyScopeFormProps> = ({ id }) => {
    return ( id ? <UpdatePropertyScopeForm id={id}/> : <CreateTicketPropertyHintForm/> )
}
