const access = require('@core/keystone/access')
const { GQLListSchema } = require('@core/keystone/schema')
const { Text, Relationship } = require('@keystonejs/fields')

const Team = new GQLListSchema('Team', {
    labelField: 'title',
    fields: {
        title: {
            type: Text,
            isRequired: true,
        },
        users: {
            type: Relationship,
            ref: 'User',
            many: true,
        },
        code: {
            type: Text,
            isRequired: false,
        },
    },
    queryLimits: {
        maxResults: 100,
    },
    access: {
        read: access.canReadOnlyIfInUsers,
        create: true,
        update: true,
        delete: true,
        auth: true,
    },
})

module.exports = {
    Team,
}
