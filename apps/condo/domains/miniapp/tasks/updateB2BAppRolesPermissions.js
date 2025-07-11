const chunk = require('lodash/chunk')
const omit = require('lodash/omit')

const { getLogger } = require('@open-condo/keystone/logging')
const { find, getSchemaCtx } = require('@open-condo/keystone/schema')
const { createTask } = require('@open-condo/keystone/tasks')

const { B2BAppRole } = require('@condo/domains/miniapp/utils/serverSchema')

// Condo allow 1000 objs per response, including relations
// { app { id } role { id } permissions ${COMMON_FIELDS} } is 3 objects per 1
// So the upper limit is 333, but we'll use the number 100 as a reserve
const CHUNK_SIZE = 100
const SENDER = { dv: 1, fingerprint: 'update-b2b-app-roles-permissions-task' }

const logger = getLogger()

async function updateB2BAppRolesPermissions (appId, oldKey, newKey) {
    if (!appId || (!oldKey && !newKey)) {
        return
    }

    const { keystone: context } = await getSchemaCtx('B2BAppRole')

    const existingManagingRoles = await find('B2BAppRole', {
        role: { canManageB2BApps: true },
        app: { id: appId },
        deletedAt: null,
    })
    const existingNonManagingRoles = await find('B2BAppRole', {
        role: { canManageB2BApps: false },
        app: { id: appId },
        deletedAt: null,
    })

    let payload

    // Soft-deletion case
    if (!newKey) {
        logger.info({
            msg: 'deleting permission from existing B2BAppRoles',
            entityId: appId,
            entity: 'B2BApp',
            data: {
                key: oldKey,
            },
        })
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
        logger.info({
            msg: 'adding new permission to existing B2BAppRoles',
            entityId: appId,
            entity: 'B2BApp',
            data: {
                key: newKey,
            },
        })
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
        logger.info({
            msg: 'rename permission key in existing B2BAppRoles',
            entityId: appId,
            entity: 'B2BApp',
            data: {
                oldKey,
                newKey,
            },
        })
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

    const totalItems = payload.length
    let modifiedItems = 0
    const chunks = chunk(payload, CHUNK_SIZE)

    for (const chunkData of chunks) {
        const modified = await B2BAppRole.updateMany(context, chunkData)
        modifiedItems += modified.length
        logger.info({
            msg: 'roles updated',
            count: modifiedItems,
            entityId: appId,
            entity: 'B2BApp',
            data: {
                total: totalItems,
            },
        })
    }
}

module.exports = {
    updateB2BAppRolesPermissions: createTask('updateB2BAppRolesPermissions', updateB2BAppRolesPermissions),
}