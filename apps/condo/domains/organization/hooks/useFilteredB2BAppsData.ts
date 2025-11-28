import get from 'lodash/get'
import uniqBy from 'lodash/uniqBy'
import { useMemo } from 'react'

import { B2BAppContextStatusType } from '@app/condo/schema'

import { B2BAppContext, B2BAppPermission, B2BAppRole } from '@condo/domains/miniapp/utils/clientSchema'
import { OrganizationEmployeeRole as OrganizationEmployeeRoleType } from '@condo/domains/organization/utils/clientSchema'
import { filterB2BAppsData } from '@condo/domains/organization/utils/roles.utils'

type UseFilteredB2BAppsDataOptions = {
    employeeRoles: OrganizationEmployeeRoleType[]
    organizationId?: string
    withoutB2BApps?: boolean
}

export const useFilteredB2BAppsData = ({
    employeeRoles,
    organizationId,
    withoutB2BApps = false,
}: UseFilteredB2BAppsDataOptions) => {
    const shouldSkipB2BAppsQueries = withoutB2BApps || !organizationId

    const {
        objs: b2bAppContexts = [],
        loading: b2bAppContextsLoading,
        error: b2bAppContextsError,
    } = B2BAppContext.useObjects({
        where: { organization: { id: organizationId }, status: B2BAppContextStatusType.Finished },
    }, {
        skip: shouldSkipB2BAppsQueries,
    })

    const connectedB2BApps = useMemo(() => {
        if (shouldSkipB2BAppsQueries) {
            return []
        }

        return uniqBy(b2bAppContexts.map(context => get(context, 'app')), 'id')
    }, [b2bAppContexts, shouldSkipB2BAppsQueries])

    const connectedB2BAppsIds = useMemo(() => connectedB2BApps.map(app => get(app, 'id')), [connectedB2BApps])

    const {
        objs: b2BAppPermissions = [],
        loading: isB2BAppPermissionsLoading,
        error: b2BAppPermissionsError,
    } = B2BAppPermission.useObjects({
        where: { app: { id_in: connectedB2BAppsIds } },
    }, {
        skip: shouldSkipB2BAppsQueries || connectedB2BAppsIds.length === 0,
    })

    const filteredConnectedB2BAppsForRolesQuery = useMemo(() => {
        if (shouldSkipB2BAppsQueries) {
            return []
        }

        return filterB2BAppsData(connectedB2BApps, b2BAppPermissions).connectedB2BApps
    }, [connectedB2BApps, b2BAppPermissions, shouldSkipB2BAppsQueries])

    const employeeRoleIds = useMemo(() => employeeRoles.map(role => role.id), [employeeRoles])

    const shouldSkipB2BAppRolesQuery = (
        shouldSkipB2BAppsQueries
        || employeeRoleIds.length === 0
        || filteredConnectedB2BAppsForRolesQuery.length === 0
    )

    const filteredConnectedB2BAppsForRolesQueryIds = useMemo(
        () => filteredConnectedB2BAppsForRolesQuery.map(app => app.id),
        [filteredConnectedB2BAppsForRolesQuery]
    )

    const {
        objs: b2bAppRoles = [],
        loading: isB2BAppRolesLoading,
        error: b2bAppRolesError,
    } = B2BAppRole.useObjects({
        where: {
            role: { id_in: employeeRoleIds },
            app: { id_in: filteredConnectedB2BAppsForRolesQueryIds },
        },
    }, {
        skip: shouldSkipB2BAppRolesQuery,
    })

    const filteredData = useMemo(() => {
        if (shouldSkipB2BAppsQueries) {
            return {
                connectedB2BApps: [],
                b2BAppPermissions: [],
                b2bAppRoles: [],
            }
        }

        return filterB2BAppsData(connectedB2BApps, b2BAppPermissions, b2bAppRoles)
    }, [b2BAppPermissions, b2bAppRoles, connectedB2BApps, shouldSkipB2BAppsQueries])

    const loading = shouldSkipB2BAppsQueries ? false : (
        b2bAppContextsLoading
        || isB2BAppPermissionsLoading
        || isB2BAppRolesLoading
    )

    const error = b2bAppContextsError || b2BAppPermissionsError || b2bAppRolesError

    return {
        ...filteredData,
        loading,
        error,
    }
}

