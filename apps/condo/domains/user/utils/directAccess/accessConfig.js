const access = require('@open-condo/keystone/access')

const USER_RIGHTS_SET_FIELD_ACCESS = {
    canReadUserEmailField: {
        read: true,
        create: access.userIsAdmin,
        update: access.userIsAdmin,
    },
    canReadUserPhoneField: {
        read: true,
        create: access.userIsAdmin,
        update: access.userIsAdmin,
    },
    canManageUserRightsSetField: {
        read: true,
        create: access.userIsAdmin,
        update: access.userIsAdmin,
    },
}

module.exports = {
    USER_RIGHTS_SET_FIELD_ACCESS,
}
