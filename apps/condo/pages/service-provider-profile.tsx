import getConfig from 'next/config'
import React from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { prepareSSRContext } from '@open-condo/miniapp-utils'
import { initializeApollo } from '@open-condo/next/apollo'
import { useIntl } from '@open-condo/next/intl'


import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { SERVICE_PROVIDER_PROFILE } from '@condo/domains/common/constants/featureflags'
import { prefetchAuthOrRedirect } from '@condo/domains/common/utils/next/auth'
import { prefetchOrganizationEmployee } from '@condo/domains/common/utils/next/organization'
import { extractSSRState } from '@condo/domains/common/utils/next/ssr'
import { BillingAppPage } from '@condo/domains/miniapp/components/AppIndex'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'

import type { GetServerSideProps } from 'next'


const { publicRuntimeConfig: {
    sppConfig,
} } = getConfig()

type PageType = React.FC & {
    requiredAccess: React.ReactNode
}

const ServiceProviderProfilePage: PageType = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'global.section.SPP' })
    const NoPermissionsMessage = intl.formatMessage({ id: 'global.noPageViewPermission' })
    const { useFlag } = useFeatureFlags()
    const isSPPOrg = useFlag(SERVICE_PROVIDER_PROFILE)

    if (sppConfig && 'BillingIntegrationId' in sppConfig && isSPPOrg) {
        return <BillingAppPage id={sppConfig.BillingIntegrationId}/>
    }

    return <LoadingOrErrorPage title={PageTitle} error={NoPermissionsMessage}/>
}

ServiceProviderProfilePage.requiredAccess = OrganizationRequired

export default ServiceProviderProfilePage

export const getServerSideProps: GetServerSideProps = async (context) => {
    const { req, res } = context

    // @ts-ignore In Next 9 the types (only!) do not match the expected types
    const { headers } = prepareSSRContext(req, res)
    const client = initializeApollo({ headers })

    const { redirect, user } = await prefetchAuthOrRedirect(client, context)
    if (redirect) return redirect

    await prefetchOrganizationEmployee({ client, context, userId: user.id })

    return extractSSRState(client, req, res, {
        props: {},
    })
}
