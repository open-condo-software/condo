import { useMemo } from 'react'

import { useAuth } from '@open-condo/next/auth'
import { useOrganization } from '@open-condo/next/organization'


export type UserAttributes = {
    userId: string | null
    userName: string | null
    userType: string | null
    isSupport: boolean
    organizationId: string | null
    isLoading: boolean
}

export const useUserAttributes = (): UserAttributes => {
    const { user, isLoading: userIsLoading } = useAuth()
    const { employee, isLoading: organizationIsLoading } = useOrganization()

    return useMemo(() => ({
        userId: user?.id || null,
        userName: user?.name || null,
        userType: user?.type || null,
        isSupport: user?.isSupport || user?.isAdmin || false,
        organizationId: employee?.organization?.id || null,
        isLoading: userIsLoading || organizationIsLoading,
    }), [user, employee, userIsLoading, organizationIsLoading])
}
