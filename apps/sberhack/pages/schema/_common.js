const { v4: uuid } = require('uuid')
const { Organization } = require('@core/keystone/schemas/Organization')
const { User } = require('@core/keystone/schemas/User')
const { GQLListSchema } = require('@core/keystone/schema')
const { Text, Relationship, Uuid, Integer, DateTimeUtc } = require('@keystonejs/fields')

const UID_FIELD = {
    factory: () => uuid(),
    type: Uuid,
    defaultValue: () => uuid(),
    schemaDoc: 'Unique object IDentification',
    isRequired: true,
    kmigratorOptions: { null: false, unique: true },
}

const ORGANIZATION_FIELD = {
    // TODO(pahaz): check access to ORG
    factory: () => ({ create: Organization._factory() }),
    type: Relationship,
    ref: 'Organization',
    isRequired: true,
    knexOptions: { isNotNullable: true }, // Relationship only!
    kmigratorOptions: { null: false },
}

const USER_FIELD = {
    factory: () => ({ create: User._factory() }),
    type: Relationship,
    ref: 'User',
    isRequired: true,
    knexOptions: { isNotNullable: true }, // Relationship only!
    kmigratorOptions: { null: false },
}

module.exports = {
    UID_FIELD,
    ORGANIZATION_FIELD,
    USER_FIELD,
}
