const dayjs = require('dayjs')
const chunk = require('lodash/chunk')

const { getLogger } = require('@open-condo/keystone/logging')
const { find, getSchemaCtx } = require('@open-condo/keystone/schema')
const { createTask } = require('@open-condo/keystone/tasks')

const { B2BAppRole } = require('@condo/domains/miniapp/utils/serverSchema')

// Condo allow 1000 objs per response, including relations
// { app { id } role { id } permissions ${COMMON_FIELDS} } is 3 objects per 1
// So the upper limit is 333, but we'll use the number 100 as a reserve
const CHUNK_SIZE = 100
const SENDER = { dv: 1, fingerprint: 'delete-b2b-app-roles-task' }

const logger = getLogger()

async function deleteB2BAppRoles (appId, organizationId) {
    if (!appId || !organizationId) {
        return
    }

    logger.info({
        entityId: appId,
        entity: 'B2BApp',
        msg: 'deleting B2BAppRoles for organization',
        data: { organizationId, appId },
    })

    const { keystone: context } = getSchemaCtx('B2BAppRole')

    const existingRoles = await find('B2BAppRole', {
        app: { id: appId },
        role: { organization: { id: organizationId } },
        deletedAt: null,
    })

    const totalRoles = existingRoles.length
    logger.info({
        msg: 'found some roles to delete',
        count: totalRoles,
        entityId: appId,
        entity: 'B2BApp',
        data: {
            organizationId, appId,
        },
    })

    const deletedAt = dayjs().toISOString()
    const deletePayload = existingRoles.map(role => ({
        id: role.id,
        data: {
            dv: 1,
            sender: SENDER,
            deletedAt,
        },
    }))

    const chunks = chunk(deletePayload, CHUNK_SIZE)

    let totalDeleted = 0
    for (const chunkData of chunks) {
        const deleted = await B2BAppRole.updateMany(context, chunkData)
        totalDeleted += deleted.length
        logger.info({
            msg: 'roles successfully deleted',
            count: totalDeleted,
            data: { organizationId, appId },
            entityId: appId,
            entity: 'B2BApp',
        })
    }
}

module.exports = {
    deleteB2BAppRoles: createTask('deleteB2BAppRoles', deleteB2BAppRoles),
}