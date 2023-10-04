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
    const CanReadServiceTitle = intl.formatMessage({ id: 'pages.condo.settings.employeeRoles.permission.canReadService' })

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

const addNamesToPermissions = (intl) => (permissionGroup): PermissionsGroup => ({
    ...permissionGroup,
    groupName: intl.formatMessage({ id: `pages.condo.settings.employeeRoles.permissionGroup.${permissionGroup.key}` }),
    permissions: permissionGroup.permissions.map(
        (permission): PermissionRow => ({
            ...permission,
            name: intl.formatMessage({ id: `pages.condo.settings.employeeRoles.permission.${permission.key}` }),
        })
    ),
})

export const useEmployeeRolesTableData = (connectedB2BApps: B2BApp[], b2BAppPermissions: B2BAppPermission[]): PermissionsGroup[] => {
    const intl = useIntl()

    const employeeRolePermissionGroups: PermissionsGroup[] = useMemo(() => [
        {
            key: 'analytics',
            permissions: [
                { key: 'canReadAnalytics' },
            ],
        },
        {
            key: 'tickets',
            permissions: [
                {
                    key: 'canReadTickets',
                    relatedCheckPermissions: ['canShareTickets'],
                    relatedUncheckPermissions: ['canManageTickets', 'canShareTickets', 'canManageTicketComments'],
                },
                {
                    key: 'canManageTickets',
                    relatedCheckPermissions: ['canReadTickets', 'canShareTickets', 'canManageTicketComments'],
                    relatedUncheckPermissions: ['canShareTickets', 'canManageTicketComments'],
                },
            ],
        },
        {
            key: 'incidents',
            permissions: [
                {
                    key: 'canReadIncidents',
                    relatedUncheckPermissions: ['canManageIncidents'],
                },
                {
                    key: 'canManageIncidents',
                    relatedCheckPermissions: ['canReadIncidents'],
                },
            ],
        },
        {
            key: 'news',
            permissions: [
                {
                    key: 'canReadNewsItems',
                    relatedUncheckPermissions: ['canManageNewsItems'],
                },
                {
                    key: 'canManageNewsItems',
                    relatedCheckPermissions: ['canReadNewsItems'],
                },
            ],
        },
        {
            key: 'properties',
            permissions: [
                {
                    key: 'canManageProperties',
                    relatedCheckPermissions: ['canReadProperties'],
                },
            ],
        },
        {
            key: 'contacts',
            permissions: [
                {
                    key: 'canReadContacts',
                    relatedUncheckPermissions: ['canManageContacts'],
                },
                {
                    key: 'canManageContacts',
                    relatedCheckPermissions: ['canReadContacts'],
                },
            ],
        },
        {
            key: 'employees',
            permissions: [
                {
                    key: 'canReadEmployees',
                    relatedUncheckPermissions: ['canManageEmployees', 'canManageRoles'],
                },
                {
                    key: 'canManageEmployees',
                    relatedCheckPermissions: ['canReadEmployees'],
                },
                {
                    key: 'canInviteNewOrganizationEmployees',
                    relatedCheckPermissions: ['canReadEmployees'],
                },
                {
                    key: 'canManageRoles',
                    relatedCheckPermissions: ['canReadEmployees'],
                },
            ],
        },
        {
            key: 'billing',
            permissions: [
                {
                    key: 'canManageIntegrations',
                    relatedCheckPermissions: ['canReadPayments', 'canReadBillingReceipts'],
                },
                {
                    key: 'canReadPayments',
                    relatedUncheckPermissions: ['canManageIntegrations'],
                },
                {
                    key: 'canReadBillingReceipts',
                    relatedUncheckPermissions: ['canManageIntegrations', 'canImportBillingReceipts'],
                },
                {
                    key: 'canImportBillingReceipts',
                    relatedCheckPermissions: ['canReadBillingReceipts'],
                },
            ],
        },
        {
            key: 'services',
            permissions: [
                { key: 'canManageB2BApps' },
            ],
        },
    ].map(addNamesToPermissions(intl))
    , [intl])

    return [
        ...employeeRolePermissionGroups,
        ...getB2BRolePermissionGroups(intl, connectedB2BApps, b2BAppPermissions),
    ]
}