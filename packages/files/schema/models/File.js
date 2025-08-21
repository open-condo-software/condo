const { historical, versioned, uuided, tracked, softDeleted, dvAndSender } = require('@open-condo/keystone/plugins')
const { GQLListSchema } = require('@open-condo/keystone/schema')

const File = new GQLListSchema('File', {
    schemaDoc: 'Stores uploaded file meta data and owner',
    fields: {
        fileMeta: {
            type: 'Json',
            isRequired: true,
            schemaDoc: 'Metadata of the file, that was uploaded to platform',
        },
        user: {
            type: 'Relationship',
            ref: 'User',
            schemaDoc: 'User who uploaded the file',
            isRequired: true,
            knexOptions: { isNotNullable: true },
            kmigratorOptions: { null: false, on_delete: 'models.PROTECT' },
        },
    },
    plugins: [uuided(), versioned(), tracked(), softDeleted(), dvAndSender(), historical()],
    access: {
        read: false,
        create: false,
        update: false,
        delete: false,
        auth: false,
    },
})

module.exports = { File }
