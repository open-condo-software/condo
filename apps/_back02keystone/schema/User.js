const { Wysiwyg } = require('@keystonejs/fields-wysiwyg-tinymce')
const { LocalFileAdapter } = require('@keystonejs/file-adapters')
const { Text, Checkbox, Password, CalendarDay, File, Relationship, DateTime } = require('@keystonejs/fields')
const { User: BaseUser, ForgotPasswordAction, ForgotPasswordService, RegisterNewUserService } = require('@core/keystone/schemas/User')
const conf = require('@core/config')
const access = require('@core/keystone/access')
const faker = require('faker')

const { Stars, Options, JsonText } = require('../custom-fields')

const AVATAR_FILE_ADAPTER = new LocalFileAdapter({
    src: `${conf.MEDIA_ROOT}/avatars`,
    path: `${conf.MEDIA_URL}/avatars`,
})

const User = BaseUser._override({
    fields: {
        avatar: { type: File, adapter: AVATAR_FILE_ADAPTER },
        rating: { type: Stars, starCount: 5 },
        settings: { type: Options, options: ['Feature1', 'Feature2'] },
        meta: { type: JsonText },
        aboutMyself: { type: Wysiwyg },
        phone: {
            factory: () => faker.phone.phoneNumberFormat(),
            type: Text,
            access: {
                read: true,
                create: access.userIsAdmin,
                update: access.userIsAdmin,
            },
            hooks: {
                resolveInput: async ({ resolvedData }) => {
                    return resolvedData['phone'] && resolvedData['phone'].toLowerCase().replace(/\D/g, '')
                },
            },
        },
        isPhoneVerified: {
            type: Checkbox,
            defaultValue: false,
            access: {
                read: true,
                create: access.userIsAdmin,
                update: access.userIsAdmin,
            },
        },
        importId: {
            factory: () => faker.random.uuid(),
            type: Text,
            access: {
                read: true,
                create: access.userIsAdmin,
                update: access.userIsAdmin,
            },
        },
    },
})

RegisterNewUserService.on('afterRegisterNewUser', async ({ parent, args, context, info, extra, result }) => {
    console.log('Fake send welcome email!', JSON.stringify(result))
})

ForgotPasswordService.on('afterStartPasswordRecovery', ({ parent, args, context, info, extra, result }) => {
    console.log('Fake send security email!', JSON.stringify(result))
})

ForgotPasswordService.on('afterChangePasswordWithToken', ({ parent, args, context, info, extra, result }) => {
    console.log('Fake send security email!', JSON.stringify(result))
})

module.exports = {
    User,
    ForgotPasswordAction,
    ForgotPasswordService,
    RegisterNewUserService,
}
