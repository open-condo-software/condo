import React from 'react'
import { useRouter } from 'next/router'
import Error from 'next/error'
import { APP_TYPES, BILLING_APP_TYPE } from '@condo/domains/miniapp/constants/common'
import get from 'lodash/get'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { useOrganization } from '@core/next/organization'
import { useIntl } from '@core/next/intl'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { ReturnBackHeaderAction } from '@condo/domains/common/components/HeaderActions'
import { AboutBillingServicePage } from '@condo/domains/miniapp/components/AppDescription'

const AboutServicePage = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'menu.Services' })
    const NoPermissionsMessage = intl.formatMessage({ id: 'NoPermissionToPage' })

    const { query: { type, id } } = useRouter()

    const userOrganization = useOrganization()
    const canManageIntegrations = get(userOrganization, ['link', 'role', 'canManageIntegrations'], false)

    if (!APP_TYPES.includes(type) || Array.isArray(id)) {
        return (
            <Error statusCode={404}/>
        )
    }

    if (!canManageIntegrations) {
        return <LoadingOrErrorPage title={PageTitle} error={NoPermissionsMessage}/>
    }

    if (type === BILLING_APP_TYPE) {
        return <AboutBillingServicePage id={id}/>
    }
    return null
}

AboutServicePage.requiredAccess = OrganizationRequired
AboutServicePage.headerAction  = <ReturnBackHeaderAction
    descriptor={{ id: 'menu.Services' }}
    path={'/services'}/>

export default AboutServicePage