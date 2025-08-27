const { historical, versioned, uuided, tracked, softDeleted, dvAndSender } = require('@open-condo/keystone/plugins')
const { GQLListSchema } = require('@open-condo/keystone/schema')

const FILE_RECORD_META_FIELDS = '{ id shareId path filename originalFilename mimetype encoding meta { dv sender { dv fingerprint } authedItem appId modelNames fileAdapter sourceAppId } }'

const FileRecord = new GQLListSchema('FileRecord', {
    schemaDoc: 'Stores uploaded file meta data and owner',
    fields: {
        fileMeta: {
            type: 'Json',
            isRequired: true,
            schemaDoc: 'Information about file including its encoding, mime type, filename and user related metadata',
            graphQLReturnType: 'FileRecordMeta',
            extendGraphQLTypes: [
                'type FileSender { dv: Int!, fingerprint: String! }',
                'type FileRecordUserMeta { dv: Int!, sender: FileSender!, authedItem: String!, appId: String!, modelNames: [String!]!, fileAdapter: String, sourceAppId: String }',
                'type FileRecordMeta { id: ID, shareId: String, path: String, filename: String!, originalFilename: String, mimetype: String!, encoding: String!, meta: FileRecordUserMeta! }',
            ],
        },
        user: {
            type: 'Relationship',
            ref: 'User',
            schemaDoc: 'User who uploaded the file',
            isRequired: true,
            knexOptions: { isNotNullable: true },
            kmigratorOptions: { null: false, on_delete: 'models.PROTECT' },
        },
        fileKey: {
            type: 'Text',
            isRequired: true,
            schemaDoc: 'Unique identifier on the storage side (eg file adapter)',
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

module.exports = { FileRecord, FILE_RECORD_META_FIELDS }
