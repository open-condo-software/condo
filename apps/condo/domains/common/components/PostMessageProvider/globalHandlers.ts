import { useCallback } from 'react'
import { notification } from 'antd'
import get from 'lodash/get'
import { useAuth } from '@open-condo/next/auth'
import { useOrganization } from '@open-condo/next/organization'
import { STAFF } from '@condo/domains/user/constants/common'

import type { RequestHandler } from './types'

export const handleNotification: RequestHandler<'CondoWebAppShowNotification'> = (params) => {
    const { type, ...restParams } = params
    notification[type](restParams)
    return { success: true }
}

export const useCurrentUserHandler: () => RequestHandler<'CondoWebAppGetCurrentUser'> = () => {
    const { user } = useAuth()
    const { organization } = useOrganization()
    const userId = get(user, 'id', null)
    const organizationId = get(organization, 'id', null)
    return useCallback(() => {
        if (!userId) {
            throw new Error('User is not authenticated!')
        }

        return {
            userId,
            userType: STAFF,
            userContextEntity: 'Organization',
            userContextEntityId: organizationId,
        }
    }, [userId, organizationId])
}