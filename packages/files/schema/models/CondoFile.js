const { historical, versioned, uuided, tracked, softDeleted, dvAndSender } = require('@open-condo/keystone/plugins')
const { GQLListSchema } = require('@open-condo/keystone/schema')

const CondoFile = new GQLListSchema('CondoFile', {
    schemaDoc: 'File uploaded to platform and meta with ownership data',
    fields: {
        file: {
            type: 'Json',
            isRequired: true,
            schemaDoc: 'File uploaded to platform',
        },
        signature: {
            type: 'Text',
            isRequired: true,
            schemaDoc: 'File signature created from user and storage meta and application secret',
        },
        user: {
            type: 'Relationship',
            ref: 'User',
            schemaDoc: 'User who uploaded the file',
            isRequired: true,
            knexOptions: { isNotNullable: true },
            kmigratorOptions: { null: false, on_delete: 'models.PROTECT' },
        },
        attach: {
            type: 'Checkbox',
            schemaDoc: 'Indicates that this file has been connected to one or more entity',
            isRequired: false,
            defaultValue: false,
            knexOptions: { isNotNullable: false },
        },
    },
    plugins: [uuided(), versioned(), tracked(), softDeleted(), dvAndSender(), historical()],
    access: {
        read: false,
        create: false,
        update: false,
        delete: false,
        auth: true,
    },
})

module.exports = { CondoFile }
