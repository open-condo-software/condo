const { Text, Checkbox, Password, Relationship, CalendarDay, File } = require('@keystonejs/fields');
const { LocalFileAdapter } = require("@keystonejs/file-adapters");
const { AuthedRelationship } = require('@keystonejs/fields-authed-relationship');
const { Wysiwyg } = require('@keystonejs/fields-wysiwyg-tinymce');
const getYear = require('date-fns/get_year');

const { KeystoneList } = require("../core/lists");
const { Stars } = require("../core/custom-fields");
const access = require("../core/access");
const conf = require("../config");

const avatarFileAdapter = new LocalFileAdapter({
    src: `${conf.MEDIA_ROOT}/avatars`,
    path: `${conf.MEDIA_URL}/avatars`,
});

const User = new KeystoneList('User', {
    // labelResolver: item => `${item.name}`,
    fields: {
        name: { type: Text },
        email: {
            type: Text,
            isUnique: true,
            // 2. Only authenticated users can read/update their own email, not any other user's.
            // Admins can read/update anyone's email.
            access: access.userIsAdminOrIsThisItem,
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
        isActive: { type: Checkbox, defaultValue: true },
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
        avatar: { type: File, adapter: avatarFileAdapter },
        rating: { type: Stars, starCount: 5 },
        aboutMyself: { type: Wysiwyg },
        dob: { type: CalendarDay, format: 'Do MMMM YYYY', yearRangeFrom: 1901, yearRangeTo: getYear(new Date()) },
        createdBy: { type: AuthedRelationship, ref: 'User', isRequired: true, access: access.readOnlyField },
    },
    access: {
        // read: access.userIsAdminOrOwner,
        read: access.canReadOnlyActive,
        create: access.userIsAdmin,
        update: access.userIsAdminOrIsThisItem,
        delete: true,
        auth: true,
    },
    adminConfig: {
        defaultPageSize: 100,
        defaultColumns: 'avatar, name, email, isAdmin, isActive',
        // defaultSort: 'name',
    },
});

module.exports = {
    User,
};
