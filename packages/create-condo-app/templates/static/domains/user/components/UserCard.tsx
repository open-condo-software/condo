import React, { useMemo } from 'react'
import { useIntl } from 'react-intl'

import { Card, List } from '@open-condo/ui'

import { useAuth } from '@/domains/user/components/AuthContext'

import { UserTypeType } from '@/gql'

export const UserCard: React.FC = () => {
    const intl = useIntl()
    const ListTitle = intl.formatMessage({ id: 'components.user.userCard.list.title' })
    const NameLabel = intl.formatMessage({ id: 'components.user.userCard.list.items.name.label' })
    const TypeLabel = intl.formatMessage({ id: 'components.user.userCard.list.items.type.label' })
    const PhoneLabel = intl.formatMessage({ id: 'components.user.userCard.list.items.phone.label' })

    const { user } = useAuth()

    const UserTypeText = useMemo(() => {
        if (user?.type === UserTypeType.Resident || user?.type === UserTypeType.Staff) {
            return intl.formatMessage({ id: `global.user.type.${user?.type}` })
        }

        return '-'
    }, [intl, user?.type])

    const listDataSource = useMemo(() => [
        { label: NameLabel, value: user?.name ?? '-' },
        { label: TypeLabel, value: UserTypeText },
        { label: PhoneLabel, value: user?.phone ?? '-' },
    ], [NameLabel, PhoneLabel, TypeLabel, UserTypeText, user?.name, user?.phone])

    return (
        <Card>
            <List title={ListTitle} dataSource={listDataSource}/>
        </Card>
    )
}