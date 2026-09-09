import { useEffect, useMemo } from 'react'

import { useCachePersistor } from '@open-condo/apollo'

import { useLaunchParams } from '@/domains/common/components/LaunchParamsContext'

import { useAuthenticatedUserQuery } from '@/gql'

export function useAuth () {
    const { persistor } = useCachePersistor()
    const { launchParams, loading: launchParamsLoading } = useLaunchParams()

    const { loading: userLoading, data } = useAuthenticatedUserQuery({
        skip: !persistor,
    })

    return useMemo(() => {
        const loading = launchParamsLoading || userLoading || !persistor
        const fetchedUser = data?.authenticatedUser
        const user = fetchedUser?.id && launchParams?.condoUserId && fetchedUser.id !== launchParams.condoUserId ? null : fetchedUser

        return { loading, user }
    }, [data?.authenticatedUser, launchParams?.condoUserId, launchParamsLoading, persistor, userLoading])
}