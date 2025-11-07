import { B2BAppContextStatusType, SortOrganizationEmployeeRolesBy } from '@app/condo/schema'
import { Typography } from 'antd'
import get from 'lodash/get'
import uniqBy from 'lodash/uniqBy'
import React, { useCallback, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import { Loader } from '@condo/domains/common/components/Loader'
import { B2BAppContext, B2BAppPermission, B2BAppRole } from '@condo/domains/miniapp/utils/clientSchema'
import { UseEmployeeRolesPermissionsGroups } from '@condo/domains/organization/hooks/useEmployeeRolesPermissionsGroups'
import { OrganizationEmployeeRole as EmployeeRole } from '@condo/domains/organization/utils/clientSchema'
import { filterB2BAppsData } from '@condo/domains/organization/utils/roles.utils'

import { BaseEmployeeRoleForm, BaseEmployeeRoleFormPropsType } from './BaseEmployeeRoleForm'


type UpdateEmployeeRoleFormProps = {
    id: string
    useEmployeeRolesPermissionsGroups?: UseEmployeeRolesPermissionsGroups
    withoutB2BApps?: boolean
}

export const UpdateEmployeeRoleForm: React.FC<UpdateEmployeeRoleFormProps> = ({
    id,
    withoutB2BApps = false,
    useEmployeeRolesPermissionsGroups,
}) => {
    const intl = useIntl()
    const NotFoundRoleError = intl.formatMessage({ id: 'pages.condo.employeeRole.update.error.notFoundRole' })

    const organization = useOrganization()
    const organizationId = useMemo(() => get(organization, ['organization', 'id']), [organization])
    const currentEmployeeRole = useMemo(() => get(organization, ['link', 'role']), [organization])

    const {
        loading: isEmployeeRolesLoading,
        objs: employeeRoles,
        error: employeeRolesError,
        count: employeeRolesCount,
    } = EmployeeRole.useObjects({
        where: { organization: { id: organizationId } },
        sortBy: [SortOrganizationEmployeeRolesBy.NameAsc],
    })

    const roleToUpdate = useMemo(() => employeeRoles.find(role => role.id === id), [employeeRoles, id])

    const {
        objs: b2bAppContexts,
        loading: b2bAppContextsLoading,
        error: b2bAppContextsError,
    } = B2BAppContext.useObjects({
        where: { organization: { id: organizationId },  status: B2BAppContextStatusType.Finished },
    }, {
        skip: withoutB2BApps,
    })

    const connectedB2BApps = useMemo(() =>
        uniqBy(b2bAppContexts.map(context => get(context, 'app')), 'id')
    , [b2bAppContexts])

    const {
        loading: isB2BAppPermissionsLoading,
        objs: b2BAppPermissions,
        error: b2BAppPermissionsError,
    } = B2BAppPermission.useObjects({
        where: { app: { id_in: connectedB2BApps.map(b2bApp => get(b2bApp, 'id')) } },
    }, {
        skip: withoutB2BApps,
    })

    const filteredConnectedB2BAppsForRolesQuery = useMemo(() =>
        filterB2BAppsData(connectedB2BApps, b2BAppPermissions).connectedB2BApps
    , [connectedB2BApps, b2BAppPermissions])

    const {
        loading: isB2BAppRolesLoading,
        objs: b2bAppRoles,
        error: b2bAppRolesError,
    } = B2BAppRole.useObjects({
        where: {
            role: { id_in: employeeRoles.map(role => role.id) },
            app: { id_in: filteredConnectedB2BAppsForRolesQuery.map(context => context.id) },
        },
    }, {
        skip: withoutB2BApps,
    })
    const updateEmployeeRole = EmployeeRole.useUpdate({})

    const action: BaseEmployeeRoleFormPropsType['createOrUpdateEmployeeRole'] = useCallback(async (values) => await updateEmployeeRole(values, roleToUpdate), [roleToUpdate, updateEmployeeRole])

    const loading = isB2BAppPermissionsLoading || b2bAppContextsLoading || isEmployeeRolesLoading || isB2BAppRolesLoading
    const error = employeeRolesError || b2bAppContextsError || b2bAppRolesError || b2BAppPermissionsError

    if (error) {
        return <Typography.Title level={4}>{error}</Typography.Title>
    }
    if (loading) {
        return <Loader/>
    }
    if (!roleToUpdate) {
        return <Typography.Title level={4}>{NotFoundRoleError}</Typography.Title>
    }

    const { connectedB2BApps: filteredConnectedB2BApps, b2BAppPermissions: filteredB2BAppPermissions, b2BAppRoles: filteredB2BAppRoles } = useMemo(() =>
        filterB2BAppsData(connectedB2BApps, b2BAppPermissions, b2bAppRoles)
    , [connectedB2BApps, b2BAppPermissions, b2bAppRoles])

    return (
        <BaseEmployeeRoleForm
            connectedB2BApps={filteredConnectedB2BApps}
            b2BAppPermissions={filteredB2BAppPermissions}
            b2bAppRoles={filteredB2BAppRoles}
            createOrUpdateEmployeeRole={action}
            employeeRoles={employeeRoles}
            employeeRoleToUpdate={roleToUpdate}
            currentEmployeeRole={currentEmployeeRole}
            useEmployeeRolesPermissionsGroups={useEmployeeRolesPermissionsGroups}
            employeeRolesCount={employeeRolesCount}
        />
    )
}
