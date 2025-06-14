const FileAdapter = require('@open-condo/keystone/fileAdapter/fileAdapter')
const { historical, versioned, uuided, tracked, softDeleted, dvAndSender } = require('@open-condo/keystone/plugins')
const { GQLListSchema } = require('@open-condo/keystone/schema')

const Adapter = new FileAdapter('condofiles', false)

const CondoFile = new GQLListSchema('CondoFile', {
    schemaDoc: 'File uploaded to platform and meta with ownership data',
    fields: {
        file: {
            type: 'CustomFile',
            adapter: Adapter,
            isRequired: true,
            schemaDoc: 'File uploaded to platform',
        },
        meta: {
            type: 'Json',
            schemaDoc: 'Untyped metadata for this object. May be used by custom integrations.',
            isRequired: false,
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
