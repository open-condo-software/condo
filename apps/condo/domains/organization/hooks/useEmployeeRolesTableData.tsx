import { B2BApp, B2BAppPermission } from '@app/condo/schema'
import { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'


export type PermissionRow = {
    key: string,
    name: string,
    relatedCheckPermissions?: string[],
    relatedUncheckPermissions?: string[]
}

export type PermissionsGroup = {
    key: string,
    b2bAppId?: string,
    groupName: string,
    permissions: PermissionRow[],
}


/**
 * Generates b2b role permissions data for settings table.
 */
const getB2BRolePermissionGroups = (intl, connectedB2BApps, b2BAppPermissions): PermissionsGroup[] => {
    const CanReadServiceTitle = intl.formatMessage({ id: 'pages.condo.settings.employeeRoles.canReadService' })

    return connectedB2BApps.map((b2bApp): PermissionsGroup => {
        const canReadKey = `canRead${b2bApp.id}`
        const appPermissions = b2BAppPermissions.filter(permission => permission.app.id === b2bApp.id)
        const appPermissionKeys = appPermissions.map(({ key }) => key)

        return {
            key: b2bApp.id,
            b2bAppId: b2bApp.id,
            groupName: b2bApp.name,
            permissions: [
                // Client side mark that employee role has b2bRole (Due to our logic this employee role can read b2bApp).
                {
                    key: `canRead${b2bApp.id}`,
                    name: CanReadServiceTitle,
                    relatedUncheckPermissions: appPermissionKeys,
                },
                ...appPermissions
                    .map((permission): PermissionRow => ({
                        key: permission.key,
                        name: permission.name,
                        relatedCheckPermissions: [canReadKey],
                    })),
            ],
        }
    })
}

export const useEmployeeRolesTableData = (connectedB2BApps: B2BApp[], b2BAppPermissions: B2BAppPermission[]): PermissionsGroup[] => {
    const intl = useIntl()
    const ServicesGroupName = intl.formatMessage({ id: 'global.section.miniapps' })
    const CanManageB2BAppsName = intl.formatMessage({ id: 'pages.condo.settings.employeeRoles.canManageB2BApps' })

    const employeeRolePermissionGroups: PermissionsGroup[] = useMemo(() => [
        {
            groupName: 'Аналитика',
            key: 'analytics',
            permissions: [
                { key: 'canReadAnalytics', name: 'Просмотр аналитики' },
            ],
        },
        {
            groupName: ServicesGroupName,
            key: 'services',
            permissions: [
                { key: 'canManageB2BApps', name: CanManageB2BAppsName },
            ],
        },
    ], [CanManageB2BAppsName, ServicesGroupName])

    return [
        ...employeeRolePermissionGroups,
        ...getB2BRolePermissionGroups(intl, connectedB2BApps, b2BAppPermissions),
    ]
}