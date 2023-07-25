const chunk = require('lodash/chunk')
const omit = require('lodash/omit')

const { find, getSchemaCtx } = require('@open-condo/keystone/schema')
const { createTask } = require('@open-condo/keystone/tasks')

const { B2BAppRole } = require('@condo/domains/miniapp/utils/serverSchema')

// Condo allow 1000 objs per response, including relations
// { app { id } role { id } permissions ${COMMON_FIELDS} } is 3 objects per 1
// So the upper limit is 333, but we'll use the number 100 as a reserve
const CHUNK_SIZE = 100
const SENDER = { dv: 1, fingerprint: 'update-b2b-app-roles-permissions-task' }

async function updateB2BAppRolesPermissions (appId, oldKey, newKey) {
    if (!appId || (!oldKey && !newKey)) {
        return
    }

    const { keystone: context } = await getSchemaCtx('B2BAppRole')

    const existingManagingRoles = await find('B2BAppRole', {
        role: { canManageIntegrations: true },
        app: { id: appId },
        deletedAt: null,
    })
    const existingNonManagingRoles = await find('B2BAppRole', {
        role: { canManageIntegrations: false },
        app: { id: appId },
        deletedAt: null,
    })

    let payload
    // Soft-deletion case
    if (!newKey) {
        payload = existingManagingRoles
            .concat(existingNonManagingRoles)
            .map(role => ({
                id: role.id,
                data: {
                    permissions: omit(role.permissions, [oldKey]),
                    dv: 1,
                    sender: SENDER,
                },
            }))
    // Adding new permission
    } else if (!oldKey) {
        const managingPayload = existingManagingRoles.map(role => ({
            id: role.id,
            data: {
                permissions: { ...role.permissions, [newKey]: true },
                dv: 1,
                sender: SENDER,
            },
        }))
        const nonManagingPayload = existingNonManagingRoles.map(role => ({
            id: role.id,
            data: {
                permissions: { ...role.permissions, [newKey]: false },
                dv: 1,
                sender: SENDER,
            },
        }))
        payload = managingPayload.concat(nonManagingPayload)
    // Key rename
    } else {
        payload = existingManagingRoles
            .concat(existingNonManagingRoles)
            .map(role => ({
                id: role.id,
                data: {
                    permissions: { ...omit(role.permissions, [oldKey]), [newKey]: role.permissions[oldKey] },
                    dv: 1,
                    sender: SENDER,
                },
            }))
    }

    const chunks = chunk(payload, CHUNK_SIZE)

    for (const chunkData of chunks) {
        await B2BAppRole.updateMany(context, chunkData)
    }
}

module.exports = {
    updateB2BAppRolesPermissions: createTask('updateB2BAppRolesPermissions', updateB2BAppRolesPermissions),
}