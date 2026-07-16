import { Router } from 'next/router'
import { useEffect } from 'react'

import { usePostMessageContext, typeCheckerToValidator } from '@open-condo/miniapp-utils/helpers/messaging'
import { useAuth } from '@open-condo/next/auth'
import { useOrganization } from '@open-condo/next/organization'
import { isValidAnalyticsParams } from '@open-condo/ui/events'

import { analytics } from '@condo/domains/common/utils/analytics'
import { flattenObject } from '@condo/domains/common/utils/flattenObject'
import { useProgressBarHandlers } from '@condo/domains/miniapp/hooks/useProgressBarHandlers'
import { STAFF } from '@condo/domains/user/constants/common'

import type { FC } from 'react'

export const CondoAppEventsHandler: FC = () => {
    const { isLoading: userLoading, user } = useAuth()
    const { addHandler } = usePostMessageContext()
    const { employee } = useOrganization()

    // ProgressBar global events
    useProgressBarHandlers()

    // User tracking
    useEffect(() => {
        if (!userLoading) {
            if (user) {
                // TODO DOMA-13100 get user data from props
                analytics.identify(user.id,
                    flattenObject({
                        name: user?.name,
                        type: user?.type || STAFF,
                        role: employee?.role?.nameNonLocalized,
                        organization: {
                            id: employee?.organization?.id,
                            features: employee?.organization?.features,
                        },
                    }))
            } else {
                analytics.reset()
            }
        }
    }, [userLoading, user, employee?.organization?.id, employee?.role?.nameNonLocalized, employee?.organization?.features])

    // Routing tracking
    useEffect(() => {
        const handleRouteChange = () => analytics.pageView()
        Router.events.on('routeChangeComplete', handleRouteChange)

        return () => {
            Router.events.off('routeChangeComplete', handleRouteChange)
        }
    }, [])

    // Condo UI events tracking
    useEffect(() => {
        addHandler('condo-ui', 'CondoWebSendAnalyticsEvent', '*', typeCheckerToValidator(isValidAnalyticsParams), async ({ params }) => {
            const { event, ...eventData } = params
            await analytics.trackUntyped(event, eventData)
            return { success: true }
        })
    }, [addHandler])

    // Organization tracking
    useEffect(() => {
        if (employee?.organization.id) {
            analytics.setGroup('organization.id', employee.organization.id)
        } else {
            analytics.removeGroup('organization.id')
        }

        if (employee?.organization.type) {
            analytics.setGroup('organization.type', employee.organization.type)
        } else {
            analytics.removeGroup('organization.type')
        }

        if (employee?.organization.tin) {
            analytics.setGroup('organization.tin', employee.organization.tin)
        } else {
            analytics.removeGroup('organization.tin')
        }

        if (employee?.role.nameNonLocalized) {
            analytics.setGroup('employee.role', employee.role.nameNonLocalized)
        } else {
            analytics.removeGroup('employee.role')
        }
    }, [employee])

    return null
}