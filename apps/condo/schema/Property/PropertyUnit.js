const { Relationship } = require('@keystonejs/fields')

const access = require('@core/keystone/access')
const { GQLListSchema } = require('@core/keystone/schema')
const { Json } = require('@core/keystone/fields')
const { historical, versioned, uuided, tracked, softDeleted } = require('@core/keystone/plugins')

const { SENDER_FIELD, DV_FIELD, UID_FIELD } = require('../_common')

const PropertyUnit = new GQLListSchema('PropertyUnit', {
    schemaDoc: 'Property unit. The property is divided into separate `unit` parts, each of which can be owned by an independent owner',
    fields: {
        uid: UID_FIELD,
        dv: DV_FIELD,
        sender: SENDER_FIELD,
        property: {
            type: Relationship,
            ref: 'Property',
            isRequired: true,
            knexOptions: { isNotNullable: true }, // Relationship only!
            kmigratorOptions: { null: false },
        },
        map: {
            type: Json,
            isRequired: true,
            schemaDoc: 'Unit map/schema',
            kmigratorOptions: { null: false },
        },
    },
    plugins: [uuided(), versioned(), tracked(), softDeleted(), historical()],
    // TODO(Dimitreee):use access check from access.js
    access: {
        read: true,
        create: access.userIsAuthenticated,
        update: access.userIsAuthenticated,
        delete: false,
        auth: true,
    },
})

module.exports = {
    PropertyUnit,
}