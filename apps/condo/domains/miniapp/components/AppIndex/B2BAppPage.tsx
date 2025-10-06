import dayjs from 'dayjs'
import get from 'lodash/get'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'

import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Typography } from '@open-condo/ui'

import { PageContent, PageWrapper, PageHeader } from '@condo/domains/common/components/containers/BaseLayout'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { analytics } from '@condo/domains/common/utils/analytics'
import { IFrame } from '@condo/domains/miniapp/components/IFrame'
import { B2BAppContext, B2BAppRole } from '@condo/domains/miniapp/utils/clientSchema'


type B2BAppPageProps = {
    id: string
}

export const B2BAppPage: React.FC<B2BAppPageProps> = ({ id }) => {
    const intl = useIntl()
    const FallbackPageTitle = intl.formatMessage({ id: 'global.section.miniapps' })
    const SupportNotAllowedMessage = intl.formatMessage({ id: 'miniapp.supportIsNotAllowed' })
    const LoadingMessage = intl.formatMessage({ id: 'Loading' })

    const router = useRouter()
    const auth = useAuth()
    const isSupport = get(auth, ['user', 'isSupport'], false)
    const isAdmin = get(auth, ['user', 'isAdmin'], false)
    const hasRightsSet = Boolean(get(auth, ['user', 'rightsSet']))

    const userOrganization = useOrganization()
    const organizationId = get(userOrganization, ['organization', 'id'], null)
    const employeeRoleId = get(userOrganization, ['link', 'role', 'id'], null)

    const {
        obj: context,
        loading: contextLoading,
        error: contextError,
    } = B2BAppContext.useObject({ where: { app: { id }, organization: { id: organizationId } } })
    const {
        obj: appRole,
        loading: appRoleLoading,
        error: appRoleError,
    } = B2BAppRole.useObject({ where: { app: { id }, role: { id: employeeRoleId } } })

    const appUrl = get(context, ['app', 'appUrl'], null)
    const appName = get(context, ['app', 'name'], null)
    const hasDynamicTitle = get(context, ['app', 'hasDynamicTitle'], false)

    // NOTE 1: Page visiting is valid if context exists, visitor has B2BAppRole and app has appUrl
    // NOTE 2: In case of invalid id it will redirect to about page, where appId is checked
    useEffect(() => {
        if (!contextLoading && !contextError && !appRoleLoading && !appRoleError && (!context || !appRole || !appUrl)) {
            router.push(`/miniapps/${id}/about`)
        }
    }, [
        id,
        context,
        contextLoading,
        contextError,
        appRole,
        appRoleLoading,
        appRoleError,
        appUrl,
        router,
    ])

    const shouldSendAnalytics =
        !(contextLoading || contextError || appRoleLoading || appRoleError || isSupport || isAdmin)
        && Boolean(appUrl && appRole && context)

    useEffect(() => {
        if (!shouldSendAnalytics) return

        const startedAt = dayjs().toISOString()

        analytics.track('miniapp_session_start', { appId: id, startedAt })

        return () => {
            const leftAt = dayjs().toISOString()
            const durationInSec = Math.round(dayjs(leftAt).diff(dayjs(startedAt)) / 1000)

            analytics.track('miniapp_session_end', { appId: id, startedAt, durationInSec })
        }
    }, [id, shouldSendAnalytics])

    // Save `b2bAppNext` for iframe and then remove it from URL.
    // If it stays, opening the same deeplink as the current URL won’t trigger navigation in the miniapp.
    const [b2bAppNextUrl, setB2bAppNextUrl] = useState<string | null>(null)
    useEffect(() => {
        const queryB2bAppNext = router.query?.b2bAppNext
        if (typeof queryB2bAppNext === 'string') {
            setB2bAppNextUrl(queryB2bAppNext)

            const { b2bAppNext, ...rest } = router.query
            router.replace(
                { pathname: router.pathname, query: rest },
                undefined,
                { shallow: true }
            )
        }
    }, [router])
    const appUrlWithParams = b2bAppNextUrl ? `${appUrl}?next=${encodeURIComponent(b2bAppNextUrl)}` : appUrl

    if (contextLoading || contextError || appRoleLoading || appRoleError) {
        return <LoadingOrErrorPage error={contextError || appRoleError} loading={contextLoading || appRoleLoading} title={LoadingMessage}/>
    }

    if (isSupport || isAdmin || hasRightsSet) {
        return <LoadingOrErrorPage title={FallbackPageTitle} error={SupportNotAllowedMessage}/>
    }

    return (
        <>
            <Head>
                <title>{appName || FallbackPageTitle}</title>
            </Head>
            <PageWrapper>
                {!hasDynamicTitle && (
                    <PageHeader title={<Typography.Title level={1}>{appName || FallbackPageTitle}</Typography.Title>} spaced/>
                )}
                <PageContent>
                    {/* NOTE: since router.push redirecting in useEffect is async
                    we need to prevent iframe loading in cases where everything is (not) loaded fine,
                    but redirect is still happening*/}
                    {Boolean(appUrlWithParams && appRole && context) && (
                        <IFrame
                            src={appUrlWithParams}
                            reloadScope='organization'
                            withLoader
                            withPrefetch
                            withResize
                            allowFullscreen
                        />
                    )}
                </PageContent>
            </PageWrapper>
        </>
    )
}