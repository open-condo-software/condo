import { B2BAppContextStatusType, SortOrganizationEmployeeRolesBy } from '@app/condo/schema'
import { Typography } from 'antd'
import get from 'lodash/get'
import uniqBy from 'lodash/uniqBy'
import React, { useCallback, useMemo } from 'react'


import { useOrganization } from '@open-condo/next/organization'

import { Loader } from '@condo/domains/common/components/Loader'
import { B2BAppContext, B2BAppPermission, B2BAppRole } from '@condo/domains/miniapp/utils/clientSchema'
import { UseEmployeeRolesPermissionsGroups } from '@condo/domains/organization/hooks/useEmployeeRolesPermissionsGroups'
import { OrganizationEmployeeRole as EmployeeRole } from '@condo/domains/organization/utils/clientSchema'

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
        loading: isB2BAppRolesLoading,
        objs: b2bAppRoles,
        error: b2bAppRolesError,
    } = B2BAppRole.useObjects({
        where: {
            role: { id_in: employeeRoles.map(role => role.id) },
            app: { id_in: connectedB2BApps.map(context => context.id) },
        },
    }, {
        skip: withoutB2BApps,
    })

    const {
        loading: isB2BAppPermissionsLoading,
        objs: b2BAppPermissions,
        error: b2BAppPermissionsError,
    } = B2BAppPermission.useObjects({
        where: { app: { id_in: connectedB2BApps.map(b2bApp => get(b2bApp, 'id')) } },
    }, {
        skip: withoutB2BApps,
    })

    const createEmployeeRole = EmployeeRole.useCreate({
        organization: { connect: { id: organizationId } },
    })

    const action: BaseEmployeeRoleFormPropsType['createOrUpdateEmployeeRole'] = useCallback(async (values) => await createEmployeeRole(values), [createEmployeeRole])

    const loading = isB2BAppPermissionsLoading || b2bAppContextsLoading || isEmployeeRolesLoading || isB2BAppRolesLoading
    const error = employeeRolesError || b2bAppContextsError || b2bAppRolesError || b2BAppPermissionsError

    if (error) {
        return <Typography.Title level={4}>{error}</Typography.Title>
    }
    if (loading) {
        return <Loader/>
    }

    return (
        <BaseEmployeeRoleForm
            connectedB2BApps={connectedB2BApps}
            b2BAppPermissions={b2BAppPermissions}
            b2bAppRoles={b2bAppRoles}
            createOrUpdateEmployeeRole={action}
            useEmployeeRolesPermissionsGroups={useEmployeeRolesPermissionsGroups}
            employeeRolesCount={employeeRolesCount}
        />
    )
}
