const { DateTimeUtc } = require('@keystonejs/fields')
const { AuthedRelationship } = require('@keystonejs/fields-authed-relationship')

const { composeHook } = require('./utils')

const tracked = ({ createdAtField = 'createdAt', createdByField = 'createdBy', updatedAtField = 'updatedAt', updatedByField = 'updatedBy' } = {}) => ({ fields = {}, hooks = {}, ...rest }) => {
    const datedOptions = {
        type: DateTimeUtc,
        kmigratorOptions: { db_index: true },
        access: {
            read: true,
            create: false,
            update: false,
        },
    }

    const relationshipOptions = {
        type: AuthedRelationship,
        ref: 'User',
        access: {
            read: true,
            create: false,
            update: false,
        },
    }

    if (createdAtField) {
        fields[createdAtField] = { ...datedOptions }
    }

    if (updatedAtField) {
        fields[updatedAtField] = { ...datedOptions }
    }

    if (createdByField) {
        fields[createdByField] = { ...relationshipOptions }
    }

    if (updatedByField) {
        fields[updatedByField] = { ...relationshipOptions }
    }

    const newResolveInput = ({ resolvedData, existingItem, operation, context }) => {
        // DATED
        const dateNow = new Date().toISOString()
        if (operation === 'create') {
            if (createdAtField) {
                resolvedData[createdAtField] = dateNow
            }
            if (updatedAtField) {
                resolvedData[updatedAtField] = dateNow
            }
        } else if (operation === 'update') {
            if (createdAtField) {
                delete resolvedData[createdAtField] // createdAtField No longer sent by api/admin, but access control can be skipped!
            }
            if (updatedAtField) {
                resolvedData[updatedAtField] = dateNow
            }
        }

        // BY TRACKING
        const { authedItem: { id = null } = {} } = context // If not logged in, the id is set to `null`
        if (operation === 'create') {
            if (createdByField) {
                resolvedData[createdByField] = id
            }
            if (updatedByField) {
                resolvedData[updatedByField] = id
            }
        } else if (operation === 'update') {
            if (createdByField) {
                delete resolvedData[createdByField] // createdAtField No longer sent by api/admin, but access control can be skipped!
            }
            if (updatedByField) {
                resolvedData[updatedByField] = id
            }
        }

        return resolvedData
    }
    const originalResolveInput = hooks.resolveInput
    hooks.resolveInput = composeHook(originalResolveInput, newResolveInput)
    return { fields, hooks, ...rest }
}

module.exports = {
    tracked,
}
