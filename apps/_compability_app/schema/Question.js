const { GQLListSchema } = require('@core/keystone/schema')
const { Text, Relationship } = require('@keystonejs/fields')
const access = require('@core/keystone/access')

const Question = new GQLListSchema('Question', {
    fields: {
        name: {
            type: Text,
            required: true,
        },
        answers: {
            type: Relationship,
            required: true,
            many: true,
            ref: 'Answer',
        },
    },
    access: {
        read: access.canReadOnlyActive,
        create: access.userIsAdmin,
        update: access.userIsAdminOrIsThisItem,
        delete: access.userIsAdmin,
        auth: true,
    },
    adminDoc: 'A list of Questions',
    adminConfig: {
        defaultPageSize: 50,
        maximumPageSize: 200,
        defaultColumns: 'name',
    },
})

module.exports = {
    Question,
}
