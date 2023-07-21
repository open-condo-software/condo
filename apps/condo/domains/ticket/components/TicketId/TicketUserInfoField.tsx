import { Ticket, User } from '@app/condo/schema'
import { get } from 'lodash'
import Link from 'next/link'
import React, { useMemo } from 'react'

import { Typography } from '@open-condo/ui'

import { formatPhone } from '@condo/domains/common/utils/helpers'
import { UserNameField } from '@condo/domains/user/components/UserNameField'

interface IUserInfoLink {
    href?: string
    children: React.ReactNode
}

const UserInfoLink: React.FC<IUserInfoLink> = ({ href, children }) => {
    if (!href) {
        return <Typography.Text>{children}</Typography.Text>
    }

    return (
        <Typography.Link href={href}>
            {children}
        </Typography.Link>
    )
}

interface ITicketUserInfoFieldProps {
    user?: Partial<User>
    nameLink?: string
    phonePrefix?: string
}

export const TicketUserInfoField: React.FC<ITicketUserInfoFieldProps> = (props) => {
    const id = useMemo(() => get(props, ['user', 'id']), [props])
    const name = useMemo(() => get(props, ['user', 'name']), [props])
    const nameLink = useMemo(() => get(props, ['nameLink'], '#'), [props])
    const phone = useMemo(() => get(props, ['user', 'phone']), [props])
    const email = useMemo(() => get(props, ['user', 'email']), [props])
    const userInfo = useMemo(() => [], [])

    if (name) {
        userInfo.push(
            <UserNameField user={{ name, id }}>
                {({ name: userName, postfix }) => (
                    <Link href={nameLink}>
                        <a>
                            {userName}
                            {postfix && (
                                <Typography.Text type='secondary'>&nbsp;{postfix}</Typography.Text>
                            )}
                        </a>
                    </Link>
                )}
            </UserNameField>
        )
    }

    if (phone) {
        userInfo.push(
            <UserInfoLink href={`tel:${props.phonePrefix ? `${props.phonePrefix}${phone}` : `${phone}`}`}>
                {formatPhone(phone)}
            </UserInfoLink>
        )
    }

    if (email) {
        userInfo.push(
            <UserInfoLink href={`mailto:${email}`}>
                {email}
            </UserInfoLink>
        )
    }

    const renderUserInfo = useMemo(() => {
        return userInfo.map((item, i) => (
            <div key={i}>
                {item}
                {i !== userInfo.length - 1 && (
                    <br />
                )}
            </div>
        ))
    }, [userInfo])

    return (
        <>
            {renderUserInfo}
        </>
    )
}
