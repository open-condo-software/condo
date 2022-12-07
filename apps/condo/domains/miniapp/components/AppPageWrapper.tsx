import React from 'react'
import { useRouter } from 'next/router'
import get from 'lodash/get'
import { APP_TYPES } from '../constants'
import Error from 'next/error'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { useOrganization } from '@open-condo/next/organization'
import { useIntl } from '@open-condo/next/intl'

export const AppPageWrapper: React.FC = ({ children }) => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'global.section.miniapps' })
    const NoPermissionsMessage = intl.formatMessage({ id: 'global.noPageViewPermission' })

    const { query: { type, id } } = useRouter()

    const userOrganization = useOrganization()
    const canManageIntegrations = get(userOrganization, ['link', 'role', 'canManageIntegrations'], false)

    if (Array.isArray(type) || Array.isArray(id) || !APP_TYPES.includes(type)) {
        return (
            <Error statusCode={404}/>
        )
    }

    if (!canManageIntegrations) {
        return <LoadingOrErrorPage title={PageTitle} error={NoPermissionsMessage}/>
    }
    return (
        <>
            {children}
        </>
    )
}