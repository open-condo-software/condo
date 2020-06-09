const { Wysiwyg } = require('@keystonejs/fields-wysiwyg-tinymce')
const { LocalFileAdapter } = require('@keystonejs/file-adapters')
const { Text, Checkbox, Password, CalendarDay, File, Relationship, DateTime } = require('@keystonejs/fields')
const { Organization: BaseOrganization, OrganizationToUserLink, OrganizationService } = require('@core/keystone/schemas/Organization')
const conf = require('@core/config')
const faker = require('faker')

const AVATAR_FILE_ADAPTER = new LocalFileAdapter({
    src: `${conf.MEDIA_ROOT}/orgavatars`,
    path: `${conf.MEDIA_URL}/orgavatars`,
})

const Organization = BaseOrganization._override({
    fields: {
        // settings: { type: MultiCheck, options: ['Feature1', 'Feature2'] },
        avatar: { type: File, adapter: AVATAR_FILE_ADAPTER },
        description: {
            factory: faker.lorem.paragraph(),
            type: Wysiwyg,
        },
    },
})

module.exports = {
    Organization,
    OrganizationToUserLink,
    OrganizationService,
}
