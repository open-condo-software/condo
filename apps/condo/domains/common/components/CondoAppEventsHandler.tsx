import { Router } from 'next/router'
import { useCallback, useEffect } from 'react'

import { useAuth } from '@open-condo/next/auth'
import { useOrganization } from '@open-condo/next/organization'

import { CondoFeaturesContext } from '@condo/domains/common/hooks/useUserAttributes'
import { analytics } from '@condo/domains/common/utils/analytics'
import { clearPostHogInlineStyles, createSurveyBackdrop, injectPostHogSurveyStyles } from '@condo/domains/common/utils/posthogSurveyStyles'

import { usePostMessageContext } from './PostMessageProvider'

import type { RequestHandler } from './PostMessageProvider/types'
import type { FC } from 'react'


export const CondoAppEventsHandler: FC<{ userAttributes: CondoFeaturesContext }> = ({ userAttributes }) => {
    const { user, organization, isLoading, ...appContext } = userAttributes
    const { addEventHandler } = usePostMessageContext()
    const { employee } = useOrganization()

    // User tracking
    useEffect(() => {
        if (!isLoading) {
            if (user) {
                analytics.identify(user.userId, {
                    name: user.userName,
                    type: user.userType,
                    organization_id: organization,
                    ...appContext,
                })
            } else {
                analytics.reset()
            }
        }
    }, [isLoading, user, organization, appContext])

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

    useEffect(() => {
        addEventHandler('CondoWebSendAnalyticsEvent', '*', handleExternalAnalyticsEvent)
    }, [addEventHandler, handleExternalAnalyticsEvent])

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


    useEffect(() => {
        const overrideSurveyStyles = () => {
            clearPostHogInlineStyles()
            injectPostHogSurveyStyles()
            createSurveyBackdrop()
        }

        const surveyObserver = new MutationObserver(() => {
            overrideSurveyStyles()
        })

        surveyObserver.observe(document.body, {
            childList: true,
        })

        return () => {
            surveyObserver?.disconnect()
        }
    }, [])

    return null
}