const { historical, versioned, uuided, tracked, softDeleted, dvAndSender } = require('@open-condo/keystone/plugins')
const { GQLListSchema, GQLCustomSchema } = require('@open-condo/keystone/schema')

const FILE_RECORD_USER_META = '{ dv sender { dv fingerprint } authedItemId appId modelNames sourceAppId }'
const FILE_RECORD_META_FIELDS = `{ id fileAdapter recordId path filename originalFilename mimetype encoding meta ${FILE_RECORD_USER_META} }`
const FILE_RECORD_PUBLIC_META_FIELDS = `{ id recordId path filename originalFilename mimetype encoding meta ${FILE_RECORD_USER_META} }`


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
                'type FileRecordUserMeta { dv: Int!, sender: FileSender!, authedItemId: ID!, appId: String!, modelNames: [String!]!, sourceAppId: String }',
                'type FileRecordMeta { id: ID, fileAdapter: String, recordId: ID, path: String, filename: String!, originalFilename: String, mimetype: String!, encoding: String!, meta: FileRecordUserMeta! }',
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
        fileAdapter: {
            type: 'Text',
            schemaDoc: 'Type of the file adapter with which binary was saved to storage',
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

const FileRecordScalarSchema = new GQLCustomSchema('FileRecordScalar', {
    types: [
        {
            access: true,
            type: 'scalar FileUpload',
        },
    ],
})

module.exports = {
    FileRecord,
    FileRecordScalarSchema,
    FILE_RECORD_META_FIELDS,
    FILE_RECORD_PUBLIC_META_FIELDS,
}
