import get from 'lodash/get'
import Error from 'next/error'
import { useRouter } from 'next/router'
import React, { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { isSafeUrl } from '@condo/domains/common/utils/url.utils'
import { B2BAppPage, AcquiringAppPage, BillingAppPage } from '@condo/domains/miniapp/components/AppDescription'
import { BILLING_APP_TYPE, ACQUIRING_APP_TYPE } from '@condo/domains/miniapp/constants'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'

type PageType = React.FC & {
    requiredAccess: React.ReactNode
}

const MiniappDescriptionPage: PageType = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'global.section.miniapps' })
    const NoPermissionsMessage = intl.formatMessage({ id: 'global.noPageViewPermission' })

    const { query: { type, id } } = useRouter()

    const userOrganization = useOrganization()
    const canManageIntegrations = get(userOrganization, ['link', 'role', 'canManageIntegrations'], false)

    const pageContent = useMemo(() => {
        if (Array.isArray(id)) return <Error statusCode={404}/>
        if (!id || !isSafeUrl(id)) return <Error statusCode={404}/>
        if (type === BILLING_APP_TYPE) return <BillingAppPage id={id}/>
        if (type === ACQUIRING_APP_TYPE) return <AcquiringAppPage id={id}/>
        return <B2BAppPage id={id}/>
    }, [id, type])

    if (!canManageIntegrations) {
        return <LoadingOrErrorPage title={PageTitle} error={NoPermissionsMessage}/>
    }

    return pageContent
}

MiniappDescriptionPage.requiredAccess = OrganizationRequired

export default MiniappDescriptionPage