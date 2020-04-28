const { Text, Checkbox, Password, CalendarDay, File } = require('@keystonejs/fields');
const { LocalFileAdapter } = require("@keystonejs/file-adapters");
const { Wysiwyg } = require('@keystonejs/fields-wysiwyg-tinymce');
const getYear = require('date-fns/get_year');
const { byTracking, atTracking } = require('@keystonejs/list-plugins');

const { KeystoneList } = require("../core/lists");
const { Stars, MultiCheck } = require("../core/custom-fields");
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
        settings: { type: MultiCheck, options: ['Feature1', 'Feature2'], defaultValue: [false, false] },
        aboutMyself: { type: Wysiwyg },
        dob: { type: CalendarDay, format: 'Do MMMM YYYY', yearRangeFrom: 1901, yearRangeTo: getYear(new Date()) },
    },
    access: {
        // read: access.userIsAdminOrOwner,
        read: access.canReadOnlyActive,
        create: access.userIsAdmin,
        update: access.userIsAdminOrIsThisItem,
        delete: true,
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
});

module.exports = {
    User,
};
