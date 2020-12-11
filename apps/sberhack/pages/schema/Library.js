const { v4: uuid } = require('uuid')
const access = require('@core/keystone/access')
const { ORGANIZATION_FIELD, SENDER_FIELD, DV_FIELD, UID_FIELD } = require('./_common')
const { Organization } = require('@core/keystone/schemas/Organization')
const { GQLListSchema } = require('@core/keystone/schema')
const { Text, Relationship, Uuid, Integer, Select } = require('@keystonejs/fields')
const { Json } = require('@app/_back02keystone/custom-fields')
const { historical, versioned, uuided, tracked, softDeleted } = require('@app/_back02keystone/custom-plugins')

const ACCESS_TO_ALL = {
    read: true,
    create: access.userIsAuthenticated,
    update: access.userIsAuthenticated,
    delete: access.userIsAuthenticated,
    auth: true,
}

const Library = new GQLListSchema('Library', {
    fields: {
        organization: ORGANIZATION_FIELD,
        name: {
            type: Text,
            isRequired: true,
        },
    },
    plugins: [uuided(), versioned(), tracked(), softDeleted()],
    access: ACCESS_TO_ALL,
    hooks: {
        validateInput: ({ resolvedData, existingItem, addValidationError }) => {
        },
    },
})

module.exports = {
    Library,
}
