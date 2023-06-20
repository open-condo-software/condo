import get from 'lodash/get'
import Error from 'next/error'
import { useRouter } from 'next/router'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { isSafeUrl } from '@condo/domains/common/utils/url.utils'
import { B2BAppPage } from '@condo/domains/miniapp/components/AppIndex'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'


type PageType = React.FC & {
    requiredAccess: React.ReactNode
}

const MiniAppIndexPage: PageType = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'global.section.miniapps' })
    const NoPermissionsMessage = intl.formatMessage({ id: 'global.noPageViewPermission' })

    const { query: { id } } = useRouter()

    const userOrganization = useOrganization()
    const canManageIntegrations = get(userOrganization, ['link', 'role', 'canManageIntegrations'], false)

    if (Array.isArray(id) || !id || !isSafeUrl(id)) {
        return <Error statusCode={404}/>
    }

    if (!canManageIntegrations) {
        return <LoadingOrErrorPage title={PageTitle} error={NoPermissionsMessage}/>
    }

    return <B2BAppPage id={id}/>
}

MiniAppIndexPage.requiredAccess = OrganizationRequired

export default MiniAppIndexPage