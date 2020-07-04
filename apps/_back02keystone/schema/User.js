const { Wysiwyg } = require('@keystonejs/fields-wysiwyg-tinymce')
const { LocalFileAdapter } = require('@keystonejs/file-adapters')
const { Text, Checkbox, Password, CalendarDay, File, Relationship, DateTime } = require('@keystonejs/fields')
const { User: BaseUser, ForgotPasswordAction, ForgotPasswordService, RegisterService } = require('@core/keystone/schemas/User')
const conf = require('@core/config')
const access = require('@core/keystone/access')
const faker = require('faker')

const { Stars, Options } = require('../custom-fields')

const AVATAR_FILE_ADAPTER = new LocalFileAdapter({
    src: `${conf.MEDIA_ROOT}/avatars`,
    path: `${conf.MEDIA_URL}/avatars`,
})

const User = BaseUser._override({
    fields: {
        avatar: { type: File, adapter: AVATAR_FILE_ADAPTER },
        rating: { type: Stars, starCount: 5 },
        settings: { type: Options, options: ['Feature1', 'Feature2'] },
        aboutMyself: { type: Wysiwyg },
        phone: {
            factory: () => faker.phone.phoneNumberFormat(),
            type: Text,
            access: access.userIsAdminOrIsThisItem,
            hooks: {
                resolveInput: async ({ resolvedData }) => {
                    return resolvedData['phone'] && resolvedData['phone'].toLowerCase().replace(/\D/g,'')
                },
            },
        },
    },
})

RegisterService.on('afterRegisterNewUser', async (ctx) => {
    console.log('Fake send welcome email!', JSON.stringify(ctx))
})

ForgotPasswordService.on('afterStartPasswordRecovery', (ctx) => {
    console.log('Fake send security email!', JSON.stringify(ctx))
})

ForgotPasswordService.on('afterChangePasswordWithToken', (ctx) => {
    console.log('Fake send security email!', JSON.stringify(ctx))
})

module.exports = {
    User,
    ForgotPasswordAction,
    ForgotPasswordService,
    RegisterService,
}
