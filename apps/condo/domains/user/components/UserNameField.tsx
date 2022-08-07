import React from 'react'
import { useAuth } from '@condo/next/auth'
import { useIntl } from '@condo/next/intl'
import get from 'lodash/get'

// TODO(Dimitreee):move to global defs
interface IUser {
    name?: string
    id?: string
    phone?: string
}

interface IUserNameFieldProps {
    user: IUser
    children: ({ name, postfix }) => JSX.Element
}

export const UserNameField: React.FC<IUserNameFieldProps> = ({ user, children }) => {
    const intl = useIntl()
    const YouMessage = intl.formatMessage({ id: 'You' })

    const auth = useAuth()
    const id = get(auth, ['user', 'id'])
    const postfix = (user && user.id === id) ? ` (${YouMessage})` : ''

    return children({ name: (user && user.name) ? user.name : undefined, postfix })
}
