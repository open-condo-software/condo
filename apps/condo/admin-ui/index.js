import { UserSwitchOutlined } from '@ant-design/icons'
import { useMutation, gql } from '@apollo/client'
import { ItemId, AddNewItem } from '@open-keystone/app-admin-ui/components'
import React, { useCallback } from 'react'
import { useLocation } from 'react-router-dom'

import { getClientSideSenderInfo } from '@condo/domains/common/utils/userid.utils'


const SIGNIN_AS_USER_MUTATION = gql`
        mutation signinAsUser ($data: SigninAsUserInput!) {
            result: signinAsUser(data: $data) { user { id } token }
        }
`

const ICON_STYLE = {
    cursor: 'pointer',
    marginLeft: '20px',
}

function SignInAsUser () {
    const location = useLocation()
    const [signinAs] = useMutation(SIGNIN_AS_USER_MUTATION, {
        onCompleted: () => window.location.href = '/',
    })
    const onClick = useCallback(() => {
        const sender = getClientSideSenderInfo()
        const path = location.pathname.split('/').splice(2, 2)
        const userId = (path[0] === 'users' && path[1]) ? path[1] : null
        const data = { dv: 1, sender, id: userId }
        signinAs({ variables: { data } }).catch(error => {
            console.log('Failed to signin', error)
        })
    }, [location, signinAs])

    return (
        location.pathname.indexOf('users/') !== -1 && <UserSwitchOutlined style={ICON_STYLE} onClick={onClick} />
    )
}


export default {
    pages: () => {
        window.React = React
        return []
    },
    itemHeaderActions: () => {
        return (
            <div>
                <ItemId />
                <AddNewItem />
                <SignInAsUser />
            </div>
        )
    },
}
