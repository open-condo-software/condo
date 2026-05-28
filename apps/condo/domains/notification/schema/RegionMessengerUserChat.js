/**
 * Link between condo user and user's region messenger chat with bot
 */
const { historical, versioned, uuided, tracked, softDeleted, dvAndSender, analytical } = require('@open-condo/keystone/plugins')
const { GQLListSchema } = require('@open-condo/keystone/schema')

const access = require('@condo/domains/notification/access/RegionMessengerUserChat')


const RegionMessengerUserChat = new GQLListSchema('RegionMessengerUserChat', {
    schemaDoc: 'Link between condo user and user\'s region messenger chat with bot',
    fields: {
        user: {
            schemaDoc: 'Condo user',
            type: 'Relationship',
            ref: 'User',
            isRequired: true,
            knexOptions: { isNotNullable: true },
            kmigratorOptions: { null: false, on_delete: 'models.CASCADE' },
        },
        regionMessengerChatId: {
            schemaDoc: 'Id of user\'s region messenger chat with bot',
            type: 'Text',
            isRequired: true,
        },
    },
    kmigratorOptions: {
        constraints: [
            {
                type: 'models.UniqueConstraint',
                fields: ['user'],
                condition: 'Q(deletedAt__isnull=True)',
                name: 'RegionMessengerUserChat_unique_user',
            },
            {
                type: 'models.UniqueConstraint',
                fields: ['regionMessengerChatId'],
                condition: 'Q(deletedAt__isnull=True)',
                name: 'RegionMessengerUserChat_unique_regionMessengerChatId',
            },
        ],
    },
    plugins: [uuided(), versioned(), tracked(), softDeleted(), dvAndSender(), historical(), analytical()],
    access: {
        read: access.canReadRegionMessengerUserChats,
        create: access.canManageRegionMessengerUserChats,
        update: access.canManageRegionMessengerUserChats,
        delete: false,
        auth: true,
    },
})

module.exports = {
    RegionMessengerUserChat,
}
