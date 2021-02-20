import React from 'react'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { UpdateApplicationForm } from './UpdateApplicationForm'
import { CreateApplicationForm } from './CreateApplicationForm'

interface IApplicationFormProps {
    id?: string
}

export const ApplicationForm:React.FunctionComponent<IApplicationFormProps> = ({ id }) => {
    return ( id ? <UpdateApplicationForm id={id}/> : <CreateApplicationForm/> )
}
