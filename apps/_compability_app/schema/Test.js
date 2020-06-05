const { GQLListSchema } = require('@core/keystone/schema')
const { Text, Relationship } = require('@keystonejs/fields')
const access = require('@core/keystone/access')

const Test = new GQLListSchema('Test', {
    fields: {
        name: {
            type: Text,
            isRequired: true,
        },
        questions: {
            type: Relationship,
            ref: 'Question',
            many: true,
        },
    },
    access: {
        read: access.canReadOnlyActive,
        create: access.userIsAdmin,
        update: access.userIsAdminOrIsThisItem,
        delete: access.userIsAdmin,
        auth: true,
    },
    adminDoc: 'A list of Tests',
    adminConfig: {
        defaultPageSize: 50,
        maximumPageSize: 200,
        defaultColumns: 'name',
    }
})

module.exports = {
    Test,
}
