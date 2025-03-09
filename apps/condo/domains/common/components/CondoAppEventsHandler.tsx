import { Router } from 'next/router'
import { useCallback, useEffect } from 'react'

import { useAuth } from '@open-condo/next/auth'
import { useOrganization } from '@open-condo/next/organization'

import { analytics } from '@condo/domains/common/utils/analytics'
import { STAFF } from '@condo/domains/user/constants/common'

import { usePostMessageContext } from './PostMessageProvider'

import type { RequestHandler } from './PostMessageProvider/types'
import type { FC } from 'react'


export const CondoAppEventsHandler: FC = () => {
    const { isLoading: userLoading, user } = useAuth()
    const { addEventHandler } = usePostMessageContext()
    const { employee } = useOrganization()

    // User tracking
    useEffect(() => {
        if (!userLoading) {
            if (user) {
                analytics.identify(user.id, {
                    name: user?.name,
                    type: user?.type || STAFF,
                })
            } else {
                analytics.reset()
            }
        }
    }, [userLoading, user])

    // Routing tracking
    useEffect(() => {
        const handleRouteChange = () => analytics.pageView()
        Router.events.on('routeChangeComplete', handleRouteChange)

        return () => {
            Router.events.off('routeChangeComplete', handleRouteChange)
        }
    }, [])

    // UI-kit events tracking
    const handleExternalAnalyticsEvent = useCallback<RequestHandler<'CondoWebSendAnalyticsEvent'>>(async (params) => {
        const { event, ...eventData } = params
        return analytics.trackUntyped(event, eventData).then(() => ({ sent: true }))
    }, [])

    // Organization tracking
    useEffect(() => {
        if (employee) {
            if (employee.organization.id) {
                analytics.setGroup('organization.id', employee.organization.id)
            } else {
                analytics.removeGroup('organization.id')
            }

            if (employee.organization.type) {
                analytics.setGroup('organization.type', employee.organization.type)
            } else {
                analytics.removeGroup('organization.type')
            }

            if (employee.organization.tin) {
                analytics.setGroup('organization.tin', employee.organization.tin)
            } else {
                analytics.removeGroup('organization.tin')
            }

            if (employee.role.nameNonLocalized) {
                analytics.setGroup('employee.role', employee.role.nameNonLocalized)
            } else {
                analytics.removeGroup('employee.role')
            }
        }
    }, [employee])

    useEffect(() => {
        addEventHandler('CondoWebSendAnalyticsEvent', '*', handleExternalAnalyticsEvent)
    }, [addEventHandler, handleExternalAnalyticsEvent])

    return null
}