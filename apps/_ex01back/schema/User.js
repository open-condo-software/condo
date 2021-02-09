const { Wysiwyg } = require('@keystonejs/fields-wysiwyg-tinymce')
const { User: BaseUser } = require('@core/keystone/schemas/User')

const User = BaseUser._override({
    fields: {
        aboutMyself: { type: Wysiwyg },
    },
})

module.exports = {
    User,
}
