const { Text, Checkbox, Password } = require('@keystonejs/fields')

const access = require('@open-condo/keystone/access')
const { GQLListSchema } = require('@open-condo/keystone/schema')

const User = new GQLListSchema('User', {
    fields: {
        email: {
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
            type: Text,
        },
        password: {
            type: Password,
            access: {
                // 3. Only admins can see if a password is set. No-one can read their own or other user's passwords.
                read: access.userIsAdmin,
                create: access.userIsAdmin,
                // 4. Only authenticated users can update their own password. Admins can update anyone's password.
                update: access.userIsAdminOrIsThisItem,
            },
        },
    },
    access: {
        read: access.userIsAdminOrOwner,
        create: access.userIsAdmin,
        update: access.userIsAdminOrIsThisItem,
        delete: access.userIsAdmin,
        auth: true,
    },
    adminDoc: 'A list of Users',
    adminConfig: {
        defaultPageSize: 50,
        maximumPageSize: 200,
        defaultSort: 'email',
        defaultColumns: 'avatar, name, email, isAdmin',
        // defaultSort: 'name',
    },
})

module.exports = {
    User,
}
