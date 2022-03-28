import React from 'react'
import { useRouter } from 'next/router'
import get from 'lodash/get'
import { APP_TYPES } from '../constants'
import Error from 'next/error'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { useOrganization } from '@core/next/organization'
import { useIntl } from '@core/next/intl'

export const ServicePageWrapper: React.FC = ({ children }) => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'menu.Services' })
    const NoPermissionsMessage = intl.formatMessage({ id: 'NoPermissionToPage' })

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