const { GQLListSchema } = require('@core/keystone/schema')
const { Text } = require('@keystonejs/fields')
const access = require('@core/keystone/access')

const Answer = new GQLListSchema('Answer', {
    fields: {
        name: {
            type: Text,
            required: true,
        },
    },
    access: {
        read: access.canReadOnlyActive,
        create: access.userIsAdmin,
        update: access.userIsAdminOrIsThisItem,
        delete: access.userIsAdmin,
        auth: true,
    },
    adminDoc: 'A list of Answers',
    adminConfig: {
        defaultPageSize: 50,
        maximumPageSize: 200,
        defaultColumns: 'name',
    },
})

module.exports = {
    Answer,
}
