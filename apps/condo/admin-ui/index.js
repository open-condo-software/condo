/* global KEYSTONE_ADMIN_META */

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { UserSwitchOutlined, MoneyCollectOutlined } from '@ant-design/icons'
import { useMutation, gql } from '@apollo/client'
import { ItemId, AddNewItem } from '@keystonejs/app-admin-ui/components'
import React, { useCallback } from 'react'
import { useLocation, useHistory } from 'react-router-dom'

import PaymentRulesSettingsPage from '@condo/domains/acquiring/admin-ui/PaymentRulesSettingsPage'
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

function PaymentRulesSettings () {
    const location = useLocation()
    const history = useHistory()
    return (
        location.pathname.indexOf('acquiring-integration-contexts/') !== -1 && <MoneyCollectOutlined style={ICON_STYLE} onClick={() => history.push(location.pathname + '/payment-rules')}/>
    )
}


export default {
    pages: () => {
        window.React = React
        // Remove HistoryRecords from left menu. Pages are still available through the Dashboard
        const lists = Object.entries(KEYSTONE_ADMIN_META.lists)
            .filter(([listKey]) => listKey.indexOf('HistoryRecord') === -1)
            .sort(([, { label: labelA }], [, { label: labelB }]) => labelA.localeCompare(labelB))
            .map(([listKey, { label }]) => ({ listKey, label }))
        return [
            ...lists,
            {
                addToNav: false,
                path: 'acquiring-integration-contexts/:context/payment-rules',
                component: PaymentRulesSettingsPage,
            },
        ]
    },
    itemHeaderActions: () => {
        return (
            <div>
                <ItemId />
                <AddNewItem />
                <SignInAsUser />
                <PaymentRulesSettings />
            </div>
        )
    },
}
