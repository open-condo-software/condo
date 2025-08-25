const { historical, versioned, uuided, tracked, softDeleted, dvAndSender } = require('@open-condo/keystone/plugins')
const { GQLListSchema } = require('@open-condo/keystone/schema')

const FileRecord = new GQLListSchema('FileRecord', {
    schemaDoc: 'Stores uploaded file meta data and owner',
    fields: {
        fileMeta: {
            type: 'Json',
            isRequired: true,
            schemaDoc: 'Information about file including its encoding, mime type, filename and user related metadata',
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

module.exports = { FileRecord }
