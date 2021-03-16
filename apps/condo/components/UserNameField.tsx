import React from 'react'
import { useAuth } from '@core/next/auth'
import { useIntl } from '@core/next/intl'
import get from 'lodash/get'

// TODO(Dimitreee):move to global defs
interface IUser {
    name: string
    id?: string
    phone?: string
}

interface IUserNameFieldProps {
    user: IUser
    children: ({ name, postfix }) => JSX.Element
}

export const UserNameField: React.FC<IUserNameFieldProps> = ({ user, children }) => {
    const auth = useAuth()
    const int = useIntl()
    const id = get(auth, ['user', 'id'])
    const postfix = user.id === id ? ` (${int.formatMessage({ id: 'You' })})` : ''

    return children({ name: user.name, postfix })
}