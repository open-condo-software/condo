import React, { useMemo } from 'react'
import { Typography } from 'antd'
import { get } from 'lodash'

import { User } from '@app/condo/schema'

import { formatPhone } from '@condo/domains/common/utils/helpers'
import { UserNameField } from '@condo/domains/user/components/UserNameField'

interface ITicketUserInfoFieldProps {
    user?: Partial<User>
}

export const TicketUserInfoField: React.FC<ITicketUserInfoFieldProps> = (props) => {
    const id = useMemo(() => get(props, ['user', 'id']), [props])
    const name = useMemo(() => get(props, ['user', 'name']), [props])
    const phone = useMemo(() => get(props, ['user', 'phone']), [props])
    const email = useMemo(() => get(props, ['user', 'email']), [props])
    const userInfo = useMemo(() => [], [])

    if (name) {
        userInfo.push(
            <UserNameField user={{ name, id }}>
                {({ name, postfix }) => (
                    <>
                        {name}
                        {postfix && (
                            <Typography.Text type='secondary'>&nbsp;{postfix}</Typography.Text>
                        )}
                    </>
                )}
            </UserNameField>
        )
    }

    if (phone) {
        userInfo.push(formatPhone(phone))
    }

    if (email) {
        userInfo.push(email)
    }

    const renderUserInfo = useMemo(() => {
        return userInfo.map((item, i) => (
            <div key={i}>
                {item}
                {i !== userInfo.length - 1 && (
                    <br/>
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
