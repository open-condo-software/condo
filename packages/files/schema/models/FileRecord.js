const { historical, versioned, uuided, tracked, softDeleted, dvAndSender } = require('@open-condo/keystone/plugins')
const { GQLListSchema } = require('@open-condo/keystone/schema')

const FileRecord = new GQLListSchema('FileRecord', {
    schemaDoc: 'Stores uploaded file meta data and owner',
    fields: {
        fileMeta: {
            type: 'Json',
            isRequired: true,
            schemaDoc: 'Information about file including its encoding, mime type, filename and user related metadata',
            extendGraphQLTypes: ['scalar CustomUpload'],
        },
        user: {
            type: 'Relationship',
            ref: 'User',
            schemaDoc: 'User who uploaded the file',
            isRequired: true,
            knexOptions: { isNotNullable: true },
            kmigratorOptions: { null: false, on_delete: 'models.PROTECT' },
        },
        sourceId: {
            type: 'Relationship',
            ref: 'FileRecord',
            schemaDoc: 'Link to original FileRecord which was shared',
            isRequired: false,
            knexOptions: { isNotNullable: false },
            kmigratorOptions: { null: true, on_delete: 'models.PROTECT' },
        },
        sourceApp: {
            type: 'Text',
            schemaDoc: 'App id - used for final routing when original file was shared',
            isRequired: false,
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
