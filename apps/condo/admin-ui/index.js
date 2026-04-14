import { MobileOutlined, UserSwitchOutlined } from '@ant-design/icons'
import { useMutation, useQuery, gql } from '@apollo/client'
import { ItemId, AddNewItem } from '@open-keystone/app-admin-ui/components'
import React, { useCallback, useMemo } from 'react'
import { useLocation } from 'react-router-dom'

import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'


const SIGNIN_AS_USER_MUTATION = gql`
        mutation signinAsUser ($data: SigninAsUserInput!) {
            result: signinAsUser(data: $data) { user { id } token }
        }
`

const GET_USER_DATA_QUERY = gql`
        query getUserType ($id: ID!) {
            user: User(where: { id: $id }) { id type isAdmin isSupport }
        }
`

const ICON_STYLE = {
    cursor: 'pointer',
    marginLeft: '20px',
}

function useUserIdFromPath () {
    const location = useLocation()
    return useMemo(() => {
        const path = location.pathname.split('/').splice(2, 2)
        return (path[0] === 'users' && path[1]) ? path[1] : null
    }, [location.pathname])
}

function SignInAsUser () {
    const targetUserId = useUserIdFromPath()
    const [signinAs] = useMutation(SIGNIN_AS_USER_MUTATION, {
        onCompleted: () => window.location.href = '/',
    })
    const onClick = useCallback(() => {
        const sender = getClientSideSenderInfo()
        const data = { dv: 1, sender, id: targetUserId }
        signinAs({ variables: { data } }).catch(error => {
            console.log('Failed to signin', error)
        })
    }, [targetUserId, signinAs])

    return (
        location.pathname.indexOf('users/') !== -1 && <UserSwitchOutlined style={ICON_STYLE} onClick={onClick} />
    )
}

function SignInAsResident () {
    const targetUserId = useUserIdFromPath()
    const { data: targetUserData } = useQuery(GET_USER_DATA_QUERY, {
        variables: { id: targetUserId },
        skip: !targetUserId,
    })

    const isTargetResident = targetUserData?.user?.type === 'resident'
    const isTargetAdminOrIsSupport = targetUserData?.user?.isAdmin || targetUserData?.user?.isSupport

    const onClick = useCallback(async () => {
        if (!targetUserId) return
        try {
            const domainRes = await fetch('/api/resident-app-domain')
            const { residentAppDomain } = await domainRes.json()
            if (!residentAppDomain) {
                console.log('RESIDENT_APP_DOMAIN is not configured')
                return
            }
            window.open(`${residentAppDomain}/signin-as?userId=${encodeURIComponent(targetUserId)}`, '_blank')
        } catch (error) {
            console.log('Failed to open resident app', error)
        }
    }, [targetUserId])

    if (isTargetAdminOrIsSupport || !isTargetResident) return null

    return <MobileOutlined style={ICON_STYLE} onClick={onClick} title='Sign in as Resident' />
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
                <SignInAsResident />
            </div>
        )
    },
}
