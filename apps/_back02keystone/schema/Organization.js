const { Wysiwyg } = require('@keystonejs/fields-wysiwyg-tinymce')
const { LocalFileAdapter } = require('@keystonejs/file-adapters')
const { Text, Checkbox, Password, CalendarDay, File, Relationship, DateTime } = require('@keystonejs/fields')
const { Organization: BaseOrganization, OrganizationToUserLink: BaseOrganizationToUserLink, OrganizationService } = require('@core/keystone/schemas/Organization')
const access = require('@core/keystone/access')
const conf = require('@core/config')
const faker = require('faker')
const { findById } = require('@core/keystone/schema')
const { GQLCustomSchema } = require('@core/keystone/schema')

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
        isAccepted: {
            type: Checkbox,
            defaultValue: false,
            knexOptions: { isNotNullable: false },
            access: {
                read: true,
                create: access.userIsAdmin,
                update: access.userIsAdmin,
            },
        },
        isRejected: {
            type: Checkbox,
            defaultValue: false,
            knexOptions: { isNotNullable: false },
            access: {
                read: true,
                create: access.userIsAdmin,
                update: access.userIsAdmin,
            },
        },
    },
})

OrganizationService.on('beforeRegisterNewOrganization', async ({ data, extraLinkData, extraOrganizationData }) => {
    extraLinkData.isAccepted = true
    extraLinkData.isRejected = false
})

const OrganizationAcceptRejectService = new GQLCustomSchema('OrganizationAcceptRejectService', {
    types: [
        {
            access: true,
            type: 'input OrganizationToUserLinkAcceptOrRejectInput { isRejected: Boolean, isAccepted: Boolean }',
        },
    ],
    mutations: [
        {
            access: accessOnlyForOwnOrganizationToUserLinks,
            schema: 'acceptOrRejectOrganizationToUserLink(id: ID!, data: OrganizationToUserLinkAcceptOrRejectInput!): String',
            resolver: async (_, { id, data: { isRejected, isAccepted } }, context, info, { query }) => {
                isRejected = isRejected || false
                isAccepted = isAccepted || false
                if (!context.authedItem.id) throw new Error('[error] User is not authenticated')
                const { errors: err1, data: data1 } = await query(
                    `
                        mutation accept($id: ID!, $data: OrganizationToUserLinkUpdateInput!) {
                          obj: updateOrganizationToUserLink(id: $id, data: $data) {
                            id
                          }
                        }
                    `,
                    {
                        variables: {
                            id,
                            data: { isRejected, isAccepted },
                        }, skipAccessControl: true,
                    },
                )

                if (err1 || !data1.obj || !data1.obj.id) {
                    const msg = '[error] Unable to update state'
                    console.error(msg, err1)
                    throw new Error(msg)
                }

                return 'ok'
            },
        },
    ],
})

async function accessOnlyForOwnOrganizationToUserLinks ({ args: { id }, context }) {
    if (!context.authedItem || !context.authedItem.id) return false
    const link = await findById('OrganizationToUserLink', id)
    if (!link) return false
    return String(link.user) === String(context.authedItem.id)
}

module.exports = {
    Organization,
    OrganizationToUserLink,
    OrganizationService,
    OrganizationAcceptRejectService,
}
