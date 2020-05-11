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

module.exports = {
    User,
    ForgotPasswordAction,
    ForgotPasswordService,
    RegisterService,
}
