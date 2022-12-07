import React, { useMemo } from 'react'
import { useRouter } from 'next/router'
import Error from 'next/error'
import { BILLING_APP_TYPE, APP_TYPES, B2B_APP_TYPE } from '@condo/domains/miniapp/constants'
import get from 'lodash/get'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { useOrganization } from '@open-condo/next/organization'
import { useIntl } from '@open-condo/next/intl'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { AboutBillingAppPage, AboutAcquiringAppPage, AboutB2BAppPage } from '@condo/domains/miniapp/components/AppDescription'
import { AppPageWrapper } from '@condo/domains/miniapp/components/AppPageWrapper'
import { isSafeUrl } from '@condo/domains/common/utils/url.utils'

const AboutMiniAppPage = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'global.section.miniapps' })
    const NoPermissionsMessage = intl.formatMessage({ id: 'global.noPageViewPermission' })

    const { query: { type, id } } = useRouter()

    const userOrganization = useOrganization()
    const canManageIntegrations = get(userOrganization, ['link', 'role', 'canManageIntegrations'], false)

    const pageContent = useMemo(() => {
        if (Array.isArray(id) || Array.isArray(type) || !APP_TYPES.includes(type)) return <Error statusCode={404}/>
        if (!id || !isSafeUrl(id)) return <Error statusCode={404}/>
        if (type === BILLING_APP_TYPE) return <AboutBillingAppPage id={id}/>
        if (type === B2B_APP_TYPE) return <AboutB2BAppPage id={id}/>
        return <AboutAcquiringAppPage id={id}/>
    }, [id, type])

    if (!canManageIntegrations) {
        return <LoadingOrErrorPage title={PageTitle} error={NoPermissionsMessage}/>
    }

    return (
        <AppPageWrapper>
            {pageContent}
        </AppPageWrapper>
    )
}

AboutMiniAppPage.requiredAccess = OrganizationRequired

export default AboutMiniAppPage