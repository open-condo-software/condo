const { Wysiwyg } = require('@keystonejs/fields-wysiwyg-tinymce')
const { LocalFileAdapter } = require('@keystonejs/file-adapters')
const { File } = require('@keystonejs/fields')

const conf = require('@core/config')
const { ...UserSchemas } = require('@core/keystone/schemas/User')
const { User: BaseUser } = require('@core/keystone/schemas/User')
const { Json } = require('@core/keystone/fields')

const AVATAR_FILE_ADAPTER = new LocalFileAdapter({
    src: `${conf.MEDIA_ROOT}/avatars`,
    path: `${conf.MEDIA_URL}/avatars`,
})

const User = BaseUser._override({
    fields: {
        avatar: { type: File, adapter: AVATAR_FILE_ADAPTER },
        meta: { type: Json },
        aboutMyself: { type: Wysiwyg },
    },
})

module.exports = {
    ...UserSchemas,
    User,
}
