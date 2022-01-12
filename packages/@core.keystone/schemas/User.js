const faker = require('faker')
const { Text, Checkbox, Password, CalendarDay, File } = require('@keystonejs/fields')
const dayjs = require('dayjs')
const { byTracking, atTracking } = require('@keystonejs/list-plugins')

const { GQLListSchema } = require('@core/keystone/schema')
const access = require('@core/keystone/access')

const FileAdapter = require('@condo/domains/common/utils/fileAdapter')
const AVATAR_FILE_ADAPTER = new FileAdapter('avatars')

const User = new GQLListSchema('User', {
    // labelResolver: item => `${item.name}`,
    fields: {
        email: {
            factory: () => faker.internet.exampleEmail().toLowerCase(),
            type: Text,
            isUnique: true,
            // 2. Only authenticated users can read/update their own email, not any other user's.
            // Admins can read/update anyone's email.
            access: access.userIsAdminOrIsThisItem,
            hooks: {
                resolveInput: async ({ resolvedData }) => {
                    return resolvedData['email'] && resolvedData['email'].toLowerCase()
                },
            },
        },
        // TODO(pahaz): verification by email!
        isEmailVerified: {
            type: Checkbox,
            defaultValue: false,
            access: {
                read: true,
                create: access.userIsAdmin,
                update: access.userIsAdmin,
            },
        },
        isAdmin: {
            type: Checkbox,
            defaultValue: false,
            access: {
                read: true,
                create: access.userIsAdmin,
                update: access.userIsAdmin,
            },
        },
        name: {
            factory: () => faker.fake('{{name.suffix}} {{name.firstName}} {{name.lastName}}'),
            type: Text,
        },
        // TODO(pahaz): check is active on login!
        isActive: { type: Checkbox, defaultValue: true },
        password: {
            factory: () => faker.internet.password(),
            type: Password,
            access: {
                // 3. Only admins can see if a password is set. No-one can read their own or other user's passwords.
                read: access.userIsAdmin,
                create: access.userIsAdmin,
                // 4. Only authenticated users can update their own password. Admins can update anyone's password.
                update: access.userIsAdminOrIsThisItem,
            },
        },
        avatar: { type: File, adapter: AVATAR_FILE_ADAPTER },
        dob: { type: CalendarDay, format: 'Do MMMM YYYY', yearRangeFrom: 1901, yearRangeTo: dayjs().year() },
    },
    access: {
        // read: access.userIsAdminOrOwner,
        read: access.canReadOnlyActive,
        create: access.userIsAdmin,
        update: access.userIsAdminOrIsThisItem,
        delete: access.userIsAdmin,
        auth: true,
    },
    plugins: [byTracking(), atTracking()],
    adminDoc: 'A list of Users',
    adminConfig: {
        defaultPageSize: 50,
        maximumPageSize: 200,
        defaultSort: 'email',
        defaultColumns: 'avatar, name, email, isAdmin, isActive',
        // defaultSort: 'name',
    },
})

module.exports = {
    User,
}
