const { Wysiwyg } = require('@keystonejs/fields-wysiwyg-tinymce')
const { LocalFileAdapter } = require('@keystonejs/file-adapters')
const { File, Text } = require('@keystonejs/fields')

const conf = require('@core/config')
const { ...OrganizationSchemas } = require('@core/keystone/schemas/Organization')
const { Organization: BaseOrganization } = require('@core/keystone/schemas/Organization')
const { OrganizationToUserLink: BaseOrganizationToUserLink } = require('@core/keystone/schemas/Organization')
const { RegisterNewOrganizationService: BaseRegisterNewOrganizationService } = require('@core/keystone/schemas/Organization')
const { InviteNewUserToOrganizationService: BaseInviteNewUserToOrganizationService } = require('@core/keystone/schemas/Organization')

const AVATAR_FILE_ADAPTER = new LocalFileAdapter({
    src: `${conf.MEDIA_ROOT}/orgavatars`,
    path: `${conf.MEDIA_URL}/orgavatars`,
})

const Organization = BaseOrganization._override({
    fields: {
        avatar: { type: File, adapter: AVATAR_FILE_ADAPTER },
        description: {
            type: Wysiwyg,
        },
    },
})

const OrganizationToUserLink = BaseOrganizationToUserLink._override({
    fields: {
        phone: {
            type: Text,
            hooks: {
                resolveInput: async ({ resolvedData }) => {
                    return resolvedData['phone'] && resolvedData['phone'].toLowerCase().replace(/\D/g, '')
                },
            },
        },
    },
})

const RegisterNewOrganizationService = BaseRegisterNewOrganizationService._override({
    types: [
        {
            access: true,
            type: 'input RegisterNewOrganizationInput { name: String!, description: String!, avatar: Upload }',
        },
    ],
})

const InviteNewUserToOrganizationService = BaseInviteNewUserToOrganizationService._override({
    types: [
        {
            access: true,
            type: 'input InviteNewUserToOrganizationInput { organization: OrganizationWhereUniqueInput!, name: String, email: String!, phone: String }',
        },
    ],
})

InviteNewUserToOrganizationService.on('afterInviteNewUserToOrganization', ({ parent, args, context, info, extra, result }) => {
    // NOTE: send invite link by email!
    console.log('Fake send security email!', JSON.stringify(result))
})

module.exports = {
    ...OrganizationSchemas,
    Organization,
    OrganizationToUserLink,
    RegisterNewOrganizationService,
    InviteNewUserToOrganizationService,
}
