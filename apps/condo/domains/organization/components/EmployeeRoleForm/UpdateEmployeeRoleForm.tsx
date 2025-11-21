import { SortOrganizationEmployeeRolesBy } from '@app/condo/schema'
import { Typography } from 'antd'
import get from 'lodash/get'
import React, { useCallback, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import { Loader } from '@condo/domains/common/components/Loader'
import { UseEmployeeRolesPermissionsGroups } from '@condo/domains/organization/hooks/useEmployeeRolesPermissionsGroups'
import { OrganizationEmployeeRole as EmployeeRole } from '@condo/domains/organization/utils/clientSchema'
import { useFilteredB2BAppsData } from '@condo/domains/organization/hooks/useFilteredB2BAppsData'

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
        connectedB2BApps: filteredConnectedB2BApps,
        b2BAppPermissions: filteredB2BAppPermissions,
        b2bAppRoles: filteredB2BAppRoles,
        loading: isB2BAppsDataLoading,
        error: b2BAppsDataError,
    } = useFilteredB2BAppsData({
        employeeRoles,
        organizationId,
        withoutB2BApps,
    })
    const updateEmployeeRole = EmployeeRole.useUpdate({})

    const action: BaseEmployeeRoleFormPropsType['createOrUpdateEmployeeRole'] = useCallback(async (values) => await updateEmployeeRole(values, roleToUpdate), [roleToUpdate, updateEmployeeRole])

    const loading = isEmployeeRolesLoading || isB2BAppsDataLoading
    const error = employeeRolesError || b2BAppsDataError

    if (error) {
        return <Typography.Title level={4}>{error}</Typography.Title>
    }
    if (loading) {
        return <Loader/>
    }
    if (!roleToUpdate) {
        return <Typography.Title level={4}>{NotFoundRoleError}</Typography.Title>
    }

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
