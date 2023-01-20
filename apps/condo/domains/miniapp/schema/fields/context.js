const { Select } = require('@keystonejs/fields')

const { getById } = require('@open-condo/keystone/schema')

const { CONTEXT_STATUSES } = require('../../constants')

const getStatusResolver =  (modelName, idFieldName) => {
    return async function resolveInput ({ resolvedData, fieldPath, operation }) {
        if (operation === 'create' && !(fieldPath in resolvedData)) {
            const app = await getById(modelName, resolvedData[idFieldName])
            return app.contextDefaultStatus
        }

        return resolvedData[fieldPath]
    }
}

const getStatusDescription = (modelName) => `Status of ${modelName} connection, Can be one of the following: [${CONTEXT_STATUSES.map(status => `"${status}"`).join(', ')}]. If not specified explicitly on creation, uses default value from related ${modelName} model`

const STATUS_FIELD = {
    isRequired: false,
    type: Select,
    dataType: 'string',
    options: CONTEXT_STATUSES,
}

module.exports = {
    STATUS_FIELD,
    getStatusDescription,
    getStatusResolver,
}