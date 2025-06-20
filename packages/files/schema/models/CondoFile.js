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
