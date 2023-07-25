const dayjs = require('dayjs')
const chunk = require('lodash/chunk')

const { find, getSchemaCtx } = require('@open-condo/keystone/schema')
const { createTask } = require('@open-condo/keystone/tasks')

const { B2BAppRole } = require('@condo/domains/miniapp/utils/serverSchema')

// Condo allow 1000 objs per response, including relations
// { app { id } role { id } permissions ${COMMON_FIELDS} } is 3 objects per 1
// So the upper limit is 333, but we'll use the number 100 as a reserve
const CHUNK_SIZE = 100
const SENDER = { dv: 1, fingerprint: 'delete-b2b-app-roles-task' }

async function deleteB2BAppRoles (appId, organizationId) {
    if (!appId || !organizationId) {
        return
    }

    const { keystone: context } = await getSchemaCtx('B2BAppRole')

    const existingRoles = await find('B2BAppRole', {
        app: { id: appId },
        role: { organization: { id: organizationId } },
        deletedAt: null,
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

    for (const chunkData of chunks) {
        console.log(chunkData)
        await B2BAppRole.updateMany(context, chunkData)
    }
}

module.exports = {
    deleteB2BAppRoles: createTask('deleteB2BAppRoles', deleteB2BAppRoles),
}