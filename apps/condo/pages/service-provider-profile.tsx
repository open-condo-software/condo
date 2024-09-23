import getConfig from 'next/config'
import React from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { useIntl } from '@open-condo/next/intl'

import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { SERVICE_PROVIDER_PROFILE } from '@condo/domains/common/constants/featureflags'
import { BillingAppPage } from '@condo/domains/miniapp/components/AppIndex'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'

import type { GetServerSideProps } from 'next'

import { initializeApollo, prepareSSRContext } from '@/lib/apollo'
import { prefetchAuth } from '@/lib/auth'
import { extractSSRState } from '@/lib/ssr'

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

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
    // @ts-ignore In Next 9 the types (only!) do not match the expected types
    const { headers } = prepareSSRContext(req, res)
    const client = initializeApollo({ headers })

    const user = await prefetchAuth(client)

    if (!user) {
        return {
            unstable_redirect: {
                destination: '/auth/signin',
                permanent: false,
            },
        }
    }

    return extractSSRState(client, req, res, {
        props: {},
    })
}
