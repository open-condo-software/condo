import get from 'lodash/get'

import { B2BApp, B2BAppPermission, B2BAppRole } from '@app/condo/schema'
import { IntlShape } from 'react-intl/src/types'


type GetRelatedPermissionsTranslations = (intl: IntlShape, relatedPermissions: Array<string>) => string

export const getRelatedPermissionsTranslations: GetRelatedPermissionsTranslations = (intl, relatedPermissions) => (relatedPermissions || [])
    .map(key => {
        const translationKey = `pages.condo.settings.employeeRoles.permission.${key}` as FormatjsIntl.Message['ids']
        const translation = intl.formatMessage({ id: translationKey })

        if (translation === translationKey) return

        return `«${translation}»`
    })
    .filter(Boolean)
    .join(', ')

type FilterB2BAppsDataResult = {
    connectedB2BApps: B2BApp[]
    b2BAppPermissions: B2BAppPermission[]
    b2BAppRoles: B2BAppRole[]
}

export const filterB2BAppsData = (
    connectedB2BApps: B2BApp[] = [],
    b2BAppPermissions: B2BAppPermission[] = [],
    b2BAppRoles: B2BAppRole[] = []
): FilterB2BAppsDataResult => {
    const appIdsWithPermissions = new Set(b2BAppPermissions
        .map(permission => get(permission, ['app', 'id']))
        .filter(Boolean))

    const filteredConnectedB2BApps = connectedB2BApps.filter((app) => {
        const appId = get(app, 'id')

        if (!appId) return false

        const hasAppUrl = Boolean(get(app, 'appUrl'))
        const hasPermissions = appIdsWithPermissions.has(appId)

        return hasAppUrl || hasPermissions
    })

    const filteredAppIds = new Set(filteredConnectedB2BApps
        .map(app => get(app, 'id'))
        .filter(Boolean))

    const filteredB2BAppPermissions = b2BAppPermissions
        .filter(permission => filteredAppIds.has(get(permission, ['app', 'id'])))
    const filteredB2BAppRoles = b2BAppRoles
        .filter(role => filteredAppIds.has(get(role, ['app', 'id'])))

    return {
        connectedB2BApps: filteredConnectedB2BApps,
        b2BAppPermissions: filteredB2BAppPermissions,
        b2BAppRoles: filteredB2BAppRoles,
    }
}
