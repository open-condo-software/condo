const { Wysiwyg } = require('@keystonejs/fields-wysiwyg-tinymce')
const {
    User: BaseUser,
    ForgotPasswordAction,
    ForgotPasswordService,
    RegisterService,
} = require('@core/keystone/schemas/User')

const User = BaseUser._override({
    fields: {
        aboutMyself: { type: Wysiwyg },
    },
})

module.exports = {
    User,
    ForgotPasswordAction,
    ForgotPasswordService,
    RegisterService,
}
