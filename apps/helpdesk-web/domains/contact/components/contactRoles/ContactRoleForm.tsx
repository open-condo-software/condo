import React from 'react'

import { CreateContactRoleForm } from './CreateContactRoleForm'
import { UpdateContactRoleForm } from './UpdateContactRoleForm'

interface IContactRoleFormProps {
    id?: string
}

export const ContactRoleForm: React.FC<IContactRoleFormProps> = ({ id }) => {
    return ( id ? <UpdateContactRoleForm id={id}/> : <CreateContactRoleForm/> )
}
