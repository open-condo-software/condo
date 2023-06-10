/**
 * Gets children of soft-deleted objects and soft deletes them
 */

const { getLogger } = require('@open-condo/keystone/logging')
const { createCronTask } = require('@open-condo/keystone/tasks')


const logger = getLogger('garbage-collector-task')


/**
 > Books -> Authors
 >
 >  Books: { Author: { deletedAt_not = null } }
 */

/**
 * # Algorithm
 *
 * 1. Get all keystone lists
 * 2. For every list in lists:
 *  2.1. For every fk in list.fields
 *      2.1.1 GQL REQUEST: Get objects from list, that have deleted fk
 *      2.1.1 Mark that object for deletion
 * 3. For every marked object
 *  3.1 Soft-delete marked object
 *  3.2 Get
 *
 */
const collectGarbage = (schemasMeta) => {
    console.log(schemasMeta)
}

// Runs yearly
module.exports = {
    garbageCollectorTask: createCronTask('garbageCollectorTask', '0 0 1 1 *', () => {
        const schemasMeta = schemasMeta

        console.log(schemasMeta)

        collectGarbage(schemasMeta)
    }),
    collectGarbage,
}