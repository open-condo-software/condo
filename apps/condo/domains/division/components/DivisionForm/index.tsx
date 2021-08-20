import React from 'react'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { UpdateDivisionForm } from './UpdateDivisionForm'
import { CreateDivisionForm } from './CreateDivisionForm'

interface IPropertyFormProps {
    id?: string
}

export const DivisionForm: React.FC<IPropertyFormProps> = ({ id }) => {
    return ( id ? <UpdateDivisionForm id={id}/> : <CreateDivisionForm/> )
}
