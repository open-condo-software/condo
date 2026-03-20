import { useMemo } from 'react'

import { FeaturesContext } from '@open-condo/featureflags/FeatureFlagsContext'
import { useAuth } from '@open-condo/next/auth'
import { useOrganization } from '@open-condo/next/organization'


export type UserShape = {
    id: string
    type: string
    isSupport: boolean
}

export type AppFeaturesContext = {
    organization: string | null
}

export type CondoFeaturesContext = FeaturesContext<UserShape, AppFeaturesContext>

export const useUserAttributes = (): CondoFeaturesContext => {
    const { user, isLoading: userIsLoading } = useAuth()
    const { employee, isLoading: organizationIsLoading } = useOrganization()

    return useMemo(() => ({
        user: user?.id ? {
            id: user?.id,
            type: user?.type ?? 'staff',
            isSupport: user?.isSupport || user?.isAdmin || false,
        } : null,
        organization: employee?.organization?.id || null,
        isLoading: userIsLoading || organizationIsLoading,
    }), [user, employee, userIsLoading, organizationIsLoading])
}
