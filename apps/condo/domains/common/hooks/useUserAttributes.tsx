import { useMemo } from 'react'

import { useAuth } from '@open-condo/next/auth'
import { useOrganization } from '@open-condo/next/organization'


export type UserAttributes = {
    userId: string | null
    userName: string | null
    userType: string | null
    isSupport: boolean
    isAdmin: boolean
    organizationId: string | null
}

export const useUserAttributes = (): UserAttributes => {
    const { user } = useAuth()
    const { employee } = useOrganization()

    return useMemo(() => ({
        userId: user?.id || null,
        userName: user?.name || null,
        userType: user?.type || null,
        isSupport: user?.isSupport || false,
        isAdmin: user?.isAdmin || false,
        organizationId: employee?.organization?.id || null,
    }), [user, employee])
}
