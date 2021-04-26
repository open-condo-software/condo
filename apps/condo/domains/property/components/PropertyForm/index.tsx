import React from 'react'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { UpdatePropertyForm } from './UpdatePropertyForm'
import { CreatePropertyForm } from './CreatePropertyForm'

interface IPropertyFormProps {
    id?: string
}

export const PropertyForm: React.FC<IPropertyFormProps> = ({ id }) => {
    return ( id ? <UpdatePropertyForm id={id}/> : <CreatePropertyForm/> )
}
