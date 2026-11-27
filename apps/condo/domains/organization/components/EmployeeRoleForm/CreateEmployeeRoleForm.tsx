import { SortOrganizationEmployeeRolesBy } from '@app/condo/schema'
import { Typography } from 'antd'
import get from 'lodash/get'
import React, { useCallback, useMemo } from 'react'


import { useOrganization } from '@open-condo/next/organization'

import { Loader } from '@condo/domains/common/components/Loader'
import { UseEmployeeRolesPermissionsGroups } from '@condo/domains/organization/hooks/useEmployeeRolesPermissionsGroups'
import { OrganizationEmployeeRole as EmployeeRole } from '@condo/domains/organization/utils/clientSchema'
import { useFilteredB2BAppsData } from '@condo/domains/organization/hooks/useFilteredB2BAppsData'

import { BaseEmployeeRoleForm, BaseEmployeeRoleFormPropsType } from './BaseEmployeeRoleForm'


type CreateEmployeeRoleFormProps = {
    useEmployeeRolesPermissionsGroups?: UseEmployeeRolesPermissionsGroups
    withoutB2BApps?: boolean
}

export const CreateEmployeeRoleForm: React.FC<CreateEmployeeRoleFormProps> = ({
    useEmployeeRolesPermissionsGroups,
    withoutB2BApps,
}) => {
    const organization = useOrganization()
    const organizationId = useMemo(() => get(organization, ['organization', 'id']), [organization])

    const {
        loading: isEmployeeRolesLoading,
        error: employeeRolesError,
        objs: employeeRoles,
        count: employeeRolesCount,
    } = EmployeeRole.useObjects({
        where: { organization: { id: organizationId } },
        sortBy: [SortOrganizationEmployeeRolesBy.NameAsc],
    })

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

    const createEmployeeRole = EmployeeRole.useCreate({
        organization: { connect: { id: organizationId } },
    })

    const action: BaseEmployeeRoleFormPropsType['createOrUpdateEmployeeRole'] = useCallback(async (values) => await createEmployeeRole(values), [createEmployeeRole])

    const loading = isEmployeeRolesLoading || isB2BAppsDataLoading
    const error = employeeRolesError || b2BAppsDataError

    if (error) {
        return <Typography.Title level={4}>{error}</Typography.Title>
    }
    if (loading) {
        return <Loader/>
    }

    return (
        <BaseEmployeeRoleForm
            connectedB2BApps={filteredConnectedB2BApps}
            b2BAppPermissions={filteredB2BAppPermissions}
            b2bAppRoles={filteredB2BAppRoles}
            createOrUpdateEmployeeRole={action}
            useEmployeeRolesPermissionsGroups={useEmployeeRolesPermissionsGroups}
            employeeRolesCount={employeeRolesCount}
        />
    )
}
