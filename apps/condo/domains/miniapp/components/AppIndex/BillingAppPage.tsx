import React, { useEffect } from 'react'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Typography } from '@open-condo/ui'
import { PageContent, PageWrapper, PageHeader } from '@condo/domains/common/components/containers/BaseLayout'
import { BillingIntegrationOrganizationContext } from '@condo/domains/billing/utils/clientSchema'
import { BILLING_APP_TYPE } from '@condo/domains/miniapp/constants'
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
    // NOTE 2: In case of invalid id it will redirect to about page, where appId is checked
    useEffect(() => {
        if (!loading && !error && (!context || !appUrl)) {
            router.push(`/miniapps/${id}/about?type=${BILLING_APP_TYPE}`)
        }
    }, [id, loading, error, context, appUrl, router])

    // TODO(DOMA-5005): Return this restriction back till token scopes will be implemented
    // if (isSupport || isAdmin) {
    //     return <LoadingOrErrorPage title={FallbackPageTitle} error={NoPermissionMessage}/>
    // }


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