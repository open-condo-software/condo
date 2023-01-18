import { useCallback } from 'react'
import { notification } from 'antd'
import get from 'lodash/get'
import { useIntl } from '@open-condo/next/intl'
import { useAuth } from '@open-condo/next/auth'
import { useOrganization } from '@open-condo/next/organization'
import { STAFF } from '@condo/domains/user/constants/common'

import type { RequestHandler } from './types'

export const handleNotification: RequestHandler<'CondoWebAppShowNotification'> = (params) => {
    const { type, ...restParams } = params
    notification[type](restParams)
    return { success: true }
}

export const useLaunchParamsHandler: () => RequestHandler<'CondoWebAppGetLaunchParams'> = () => {
    const { locale } = useIntl()
    const { user } = useAuth()
    const { organization } = useOrganization()
    const userId = get(user, 'id', null)
    const organizationId = get(organization, 'id', null)
    return useCallback(() => {
        if (!userId) {
            throw new Error('User is not authenticated!')
        }

        return {
            condoUserId: userId,
            condoUserType: STAFF,
            condoLocale: locale,
            condoContextEntity: 'Organization',
            condoContextEntityId: organizationId,

        }
    }, [userId, organizationId, locale])
}