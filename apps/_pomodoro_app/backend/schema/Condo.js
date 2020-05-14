const access = require('@core/keystone/access')
const { GQLListSchema } = require('@core/keystone/schema')
const { Text, CalendarDay, Checkbox, Relationship } = require('@keystonejs/fields')

const Condo = new GQLListSchema('Condo', {
    // labelResolver: item => `${item.address}`,
    labelField: 'address',
    fields: {
        address: {
            type: Text,
            isRequired: true,
        },
        users: {
            type: Relationship,
            ref: 'User',
            many: true,
        },
    },
    queryLimits: {
        maxResults: 100,
    },
    access: {
        read: access.canReadOnlyIfInUsers,
        create: true,
        update: true,
        delete: false,
        auth: true,
    },
})

const ChatMessage = new GQLListSchema('ChatMessage', {
    fields: {
        chat: { type: Relationship, ref: 'Condo', many: false, isRequired: true },
        user: { type: Relationship, ref: 'User', many: false, isRequired: true },
        message: { type: Text, isRequired: true },
    },
    access: {
        read: ({ authentication: { item: user } }) => {
            if (!user) return false
            if (user.isAdmin) return {}
            return {
                chat: { users_some: { id: user.id } },
            }
        },
        create: true,
        update: true,
        delete: true,
        auth: true,
    },
})

module.exports = {
    Condo,
    ChatMessage,
}
