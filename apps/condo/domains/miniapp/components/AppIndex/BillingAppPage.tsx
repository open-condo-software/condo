import get from 'lodash/get'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { useEffect } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Typography } from '@open-condo/ui'

import { BillingIntegrationOrganizationContext } from '@condo/domains/billing/utils/clientSchema'
import { PageContent, PageWrapper, PageHeader } from '@condo/domains/common/components/containers/BaseLayout'
import { IFrame } from '@condo/domains/miniapp/components/IFrame'


type BillingAppPageProps = {
    id: string
}

export const BillingAppPage: React.FC<BillingAppPageProps> = ({ id }) => {
    const intl = useIntl()
    const FallbackPageTitle = intl.formatMessage({ id: 'global.section.miniapps' })

    const router = useRouter()
    const userOrganization = useOrganization()
    const organizationId = get(userOrganization, ['organization', 'id'], null)

    const {
        obj: context,
        loading,
        error,
    } = BillingIntegrationOrganizationContext.useObject({ where: { integration: { id }, organization: { id: organizationId } } })

    const appUrl = get(context, ['integration', 'appUrl'], null)
    const appName = get(context, ['integration', 'name'], null)

    // NOTE 1: Page visiting is valid if context exist and app has appUrl
    // NOTE 2: If condition is not met, user will be redirected to self-billing flow
    useEffect(() => {
        if (!loading && !error && (!context || !appUrl)) {
            router.push('/billing')
        }
    }, [id, loading, error, context, appUrl, router])

    return (
        <>
            <Head>
                <title>{appName || FallbackPageTitle}</title>
            </Head>
            <PageWrapper>
                <PageHeader title={<Typography.Title level={1}>{appName || FallbackPageTitle}</Typography.Title>} spaced/>
                <PageContent>
                    {appUrl && (
                        <IFrame
                            src={appUrl}
                            reloadScope='organization'
                            withLoader
                            withPrefetch
                            withResize
                        />
                    )}
                </PageContent>
            </PageWrapper>
        </>
    )
}