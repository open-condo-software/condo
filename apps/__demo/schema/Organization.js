const { Wysiwyg } = require('@keystonejs/fields-wysiwyg-tinymce')
const { LocalFileAdapter } = require('@keystonejs/file-adapters')
const { Text, File } = require('@keystonejs/fields')
const { Organization: BaseOrganization, OrganizationToUserLink: BaseOrganizationToUserLink, RegisterNewOrganizationService: BaseRegisterNewOrganizationService, InviteNewUserToOrganizationService: BaseInviteNewUserToOrganizationService, AcceptOrRejectOrganizationInviteService } = require('@core/keystone/schemas/Organization')
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
            factory: () => faker.lorem.paragraph(),
            type: Wysiwyg,
        },
    },
})

const OrganizationToUserLink = BaseOrganizationToUserLink._override({
    fields: {
        phone: {
            factory: () => faker.phone.phoneNumberFormat(),
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

RegisterNewOrganizationService.on('beforeRegisterNewOrganization', async ({ parent, args, context, info, extra }) => {
    extra.extraLinkData = { phone: context.authedItem.phone }
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
    // TODO(pahaz): show invite link! and create invite page (for not registered email)
    console.log('Fake send security email!', JSON.stringify(result))
})

module.exports = {
    Organization,
    OrganizationToUserLink,
    RegisterNewOrganizationService,
    InviteNewUserToOrganizationService,
    AcceptOrRejectOrganizationInviteService,
}
