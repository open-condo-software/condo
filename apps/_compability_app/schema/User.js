const { Wysiwyg } = require('@keystonejs/fields-wysiwyg-tinymce')
const {
    User: BaseUser,
    ForgotPasswordAction,
    ForgotPasswordService,
    RegisterService,
} = require('@core/keystone/schemas/User')
const { Relationship } = require('@keystonejs/fields')

/*
* 1) Типы тестов;
* 2) Генерация тестов в админке;
* 3) Генерация моделей;
* */

const User = BaseUser._override({
    fields: {
        aboutMyself: { type: Wysiwyg },
        tests: {
          type: Relationship,
          many: true,
          ref: 'Test',
        }
    },
})

module.exports = {
    User,
    ForgotPasswordAction,
    ForgotPasswordService,
    RegisterService,
}
