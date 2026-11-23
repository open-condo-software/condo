import getConfig from 'next/config'
import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { useIntl } from 'react-intl'

import bridge from '@open-condo/bridge'
import { Empty, Button, Spin } from '@open-condo/ui'

import { useLaunchParams } from '@/domains/common/components/LaunchParamsContext'
import { useQuery, useTRPC } from '@/domains/common/utils/trpc.client'

import type { AuthenticatedUserQuery } from '@/gql'

const { publicRuntimeConfig: { serverUrl } } = getConfig()


type UserType = AuthenticatedUserQuery['authenticatedUser']

type AuthContextType = {
    loading: boolean
    user: UserType | null
}

const AuthContext = createContext<AuthContextType>({
    loading: true,
    user: null,
})

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
    const intl = useIntl()
    const AuthErrorMessage = intl.formatMessage({ id: 'global.common.errors.serverError.message' })
    const AuthErrorDescription = intl.formatMessage({ id: 'components.user.authContext.errors.authError.description' })
    const RetryButtonLabel = intl.formatMessage({ id: 'components.user.authContext.actions.retry.label' })

    const [isOIDCLoading, setIsOIDCLoading] = useState(false)
    const { launchParams, loading: launchParamsLoading } = useLaunchParams()
    const [isError, setIsError] = useState(false)

    const trpc = useTRPC()
    const { data, isLoading: userLoading, error, refetch } = useQuery(trpc.user.authenticatedUser.queryOptions())

    useEffect(() => {
        if (error) {
            setIsError(true)
        }
    }, [error])

    const signIn = useCallback(async () => {
        const { response } = await bridge.send('CondoWebAppRequestAuth', { url: `${serverUrl}/api/auth/condo` })
        if (response.status !== 200) {
            throw new Error('Failed to authenticate via Condo Bridge')
        }
        await refetch()
    }, [refetch])

    const loading = useMemo(() => {
        return launchParamsLoading || userLoading || isOIDCLoading
    }, [launchParamsLoading, userLoading, isOIDCLoading])

    const value = useMemo(() => {
        const fetchedUser = data?.authenticatedUser
        const user = fetchedUser?.id && launchParams?.condoUserId && fetchedUser.id !== launchParams.condoUserId ? null : fetchedUser

        return {
            loading,
            user,
        }
    }, [data?.authenticatedUser, launchParams?.condoUserId, loading])

    useEffect(() => {
        // skip if loading
        if (userLoading || launchParamsLoading) {
            return
        }

        const isUserDiffers =
            !data?.authenticatedUser ||
            (launchParams?.condoUserId && data.authenticatedUser.id !== launchParams.condoUserId)


        if (isUserDiffers) {
            setIsOIDCLoading(true)
            signIn().catch((err) => {
                console.error(err)
                setIsError(true)
            }).finally(() => {
                setIsOIDCLoading(false)
            })
        }
    }, [data?.authenticatedUser, launchParams?.condoUserId, launchParamsLoading, signIn, userLoading])

    const content = useMemo(() => {
        if (isError) {
            const onRetry = () => {
                window.location.reload()
            }

            return (
                <Empty
                    image='/mascot/fail.webp'
                    title={AuthErrorMessage}
                    description={AuthErrorDescription}
                    action={<Button type='primary' onClick={onRetry}>{RetryButtonLabel}</Button>}
                />
            )
        }

        if (loading) {
            return <Spin size='large' block/>
        }

        return children
    }, [AuthErrorDescription, AuthErrorMessage, RetryButtonLabel, children, isError, loading])

    return (
        <AuthContext.Provider value={value}>
            {content}
        </AuthContext.Provider>
    )
}

export function useAuth () {
    return React.useContext(AuthContext)
}
