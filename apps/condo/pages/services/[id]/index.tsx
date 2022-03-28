import React, { useMemo } from 'react'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { ReturnBackHeaderAction } from '@condo/domains/common/components/HeaderActions'
import { useRouter } from 'next/router'
import { useIntl } from '@core/next/intl'
import { useOrganization } from '@core/next/organization'
import get from 'lodash/get'
import { APP_TYPES, BILLING_APP_TYPE } from '@condo/domains/miniapp/constants'
import Error from 'next/error'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { IndexBillingServicePage } from '@condo/domains/miniapp/components/AppIndex'
import { ServicePageWrapper } from '@condo/domains/miniapp/components/ServicePageWrapper'

const ServiceIndexPage = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'menu.Services' })
    const NoPermissionsMessage = intl.formatMessage({ id: 'NoPermissionToPage' })

    const { query: { type, id } } = useRouter()

    const userOrganization = useOrganization()
    const canManageIntegrations = get(userOrganization, ['link', 'role', 'canManageIntegrations'], false)

    const pageContent = useMemo(() => {
        if (Array.isArray(id) || Array.isArray(type) || !APP_TYPES.includes(type)) return <Error statusCode={404}/>
        if (type === BILLING_APP_TYPE) return <IndexBillingServicePage id={id}/>
        // return <AboutAcquiringServicePage id={id}/>
    }, [id, type])

    if (!canManageIntegrations) {
        return <LoadingOrErrorPage title={PageTitle} error={NoPermissionsMessage}/>
    }

    return (
        <ServicePageWrapper>
            {pageContent}
        </ServicePageWrapper>
    )
}

ServiceIndexPage.requiredAccess = OrganizationRequired
ServiceIndexPage.headerAction  = <ReturnBackHeaderAction
    descriptor={{ id: 'menu.Services' }}
    path={'/services'}/>

export default ServiceIndexPage