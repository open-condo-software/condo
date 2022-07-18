import React from 'react'

import { UpdateContactRoleForm } from './UpdateContactRoleForm'
import { CreateContactRoleForm } from './CreateContactRoleForm'

interface IContactRoleFormProps {
    id?: string
}

export const ContactRoleForm: React.FC<IContactRoleFormProps> = ({ id }) => {
    return ( id ? <UpdateContactRoleForm id={id}/> : <CreateContactRoleForm/> )
}
