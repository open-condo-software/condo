const { getLogger } = require('@open-condo/keystone/logging')
const { find, getSchemaCtx } = require('@open-condo/keystone/schema')
const { createTask } = require('@open-condo/keystone/tasks')

const { B2BAppRole } = require('@condo/domains/miniapp/utils/serverSchema')

const SENDER = { dv: 1, fingerprint: 'create-default-b2b-app-role-task' }

const logger = getLogger('miniapp/tasks/createDefaultB2BAppRoles')

async function createDefaultB2BAppRoles (appId, organizationId) {
    if (!appId || !organizationId) {
        return
    }

    logger.info({ msg: 'Creating default B2BAppRoles for organization', organizationId, appId })

    const { keystone: context } = await getSchemaCtx('B2BAppRole')

    const permissions = await find('B2BAppPermission', {
        app: { id: appId },
        deletedAt: null,
    })
    const rolePermissions = Object.assign({}, ...permissions.map(permission => ({
        [permission.key]: true,
    })))

    const organizationRoles = await find('OrganizationEmployeeRole', {
        organization: { id: organizationId },
        // TODO(DOMA-6750): Include deletedAt at filtering when roles become soft-deletable
        // deletedAt: null,
        canManageIntegrations: true,
    })
    const organizationRolesIds = organizationRoles.map(role => role.id)

    logger.info({ msg: `Found ${organizationRolesIds.length} organization roles with "canManageIntegrations" flag`, organizationId, appId, organizationRolesIds })

    const existingAppRoles = await find('B2BAppRole', {
        role: { id_in: organizationRolesIds },
        deletedAt: null,
        app: { id: appId },
    })
    const rolesToSkip = new Set(existingAppRoles.map(appRole => appRole.role))

    for (const roleId of organizationRolesIds) {
        if (rolesToSkip.has(roleId)) {
            continue
        }
        logger.info({ msg: `Creating default B2BAppRole for role ${roleId}`, organizationId, roleId, appId })
        await B2BAppRole.create(context, {
            dv: 1,
            sender: SENDER,
            app: { connect: { id: appId } },
            role: { connect: { id: roleId } },
            permissions: rolePermissions,
        })
    }
}

module.exports = {
    createDefaultB2BAppRoles: createTask('createDefaultB2BAppRoles', createDefaultB2BAppRoles),
}