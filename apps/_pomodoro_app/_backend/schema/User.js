const { Wysiwyg } = require('@keystonejs/fields-wysiwyg-tinymce')
const { User: BaseUser, ForgotPasswordAction, ForgotPasswordService, RegisterService } = require('@core/keystone/schemas/User')

const { Stars, MultiCheck } = require('../custom-fields')

const User = BaseUser._override({
    fields: {
        rating: { type: Stars, starCount: 5 },
        settings: { type: MultiCheck, options: ['Feature1', 'Feature2'] },
        aboutMyself: { type: Wysiwyg },
    },
})

ForgotPasswordService.on('afterStartPasswordRecovery', (ctx) => {
    console.log('Fake send mail!', JSON.stringify(ctx))
})

ForgotPasswordService.on('afterChangePasswordWithToken', (ctx) => {
    console.log('Fake send mail!', JSON.stringify(ctx))
})

module.exports = {
    User,
    ForgotPasswordAction,
    ForgotPasswordService,
    RegisterService,
}
