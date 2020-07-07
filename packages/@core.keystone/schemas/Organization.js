const faker = require('faker')
const { Text, Checkbox, Password, CalendarDay, File, Relationship, DateTime, Select } = require('@keystonejs/fields')
const { byTracking, atTracking } = require('@keystonejs/list-plugins')

const { GQLListSchema, GQLCustomSchema } = require('@core/keystone/schema')
const access = require('@core/keystone/access')
const conf = require('@core/config')
const { find } = require('../schema')
const { findById } = require('../schema')
const { User } = require('./User')

const Organization = new GQLListSchema('Organization', {
    fields: {
        name: {
            factory: () => faker.company.companyName(),
            type: Text,
            isRequired: true,
            kmigratorOptions: { null: false },
        },
        userLinks: {
            type: Relationship, ref: 'OrganizationToUserLink.organization', many: true,
        },
    },
    access: {
        read: access.userIsAuthenticated,
        create: access.userIsAdmin,
        update: access.userIsAdmin,
        delete: access.userIsAdmin,
        auth: true,
    },
    plugins: [byTracking(), atTracking()],
    adminDoc: 'List of Organizations',
    adminConfig: {
        defaultPageSize: 50,
        maximumPageSize: 200,
        defaultSort: 'name',
        defaultColumns: 'name, createdBy, createdAt',
    },
})

const OrganizationToUserLink = new GQLListSchema('OrganizationToUserLink', {
    fields: {
        organization: {
            factory: () => ({ create: Organization._factory() }),
            type: Relationship,
            ref: 'Organization.userLinks',
            isRequired: true,
            knexOptions: { isNotNullable: true }, // Relationship only!
            kmigratorOptions: { null: false },
            access: {
                update: access.userIsAdmin,
            }
        },
        user: {
            factory: () => ({ create: User._factory() }),
            type: Relationship,
            ref: 'User',
            isRequired: true,
            knexOptions: { isNotNullable: true }, // Relationship only!
            kmigratorOptions: { null: false },
            access: {
                update: access.userIsAdmin,
            }
        },
        role: {
            type: Select,
            options: 'owner, member',
            defaultValue: 'member',
            isRequired: true,
            kmigratorOptions: { null: false },
        },
    },
    access: {
        read: accessAllowOnlyForLinkedUsers,
        create: accessAllowOnlyForRoleOwner,
        update: accessAllowOnlyForRoleOwner,
        delete: accessAllowOnlyForRoleOwner,
        auth: true,
    },
    plugins: [byTracking(), atTracking()],
    adminDoc: 'List of relationships between Users and Organizations',
    adminConfig: {
        defaultPageSize: 50,
        maximumPageSize: 200,
        defaultColumns: 'organization, user, role',
    },
})

const OrganizationService = new GQLCustomSchema('OrganizationService', {
    types: [
        {
            access: true,
            type: 'input OrganizationRegisterNewInput { name: String!, description: String!, avatar: Upload }',
        },
    ],
    mutations: [
        {
            access: access.userIsAuthenticated,
            schema: 'registerNewOrganization(data: OrganizationRegisterNewInput!): Organization',
            resolver: async (_, { data }, context, info, { query }) => {
                const extraLinkData = {}
                const extraOrganizationData = {}
                await OrganizationService.emit('beforeRegisterNewOrganization', {
                    data, extraLinkData, extraOrganizationData })

                if (!context.authedItem.id) throw new Error('[error] User is not authenticated')
                const { errors: err1, data: data1 } = await query(
                    `
                        mutation create($data: OrganizationToUserLinkCreateInput!) {
                          obj: createOrganizationToUserLink(data: $data) {
                            id
                            organization {
                              id
                            }
                          }
                        }
                    `,
                    {
                        variables: {
                            'data': {
                                'organization': { 'create': {...data, ...extraOrganizationData} },
                                'user': { 'connect': { 'id': context.authedItem.id } },
                                'role': 'owner',
                                ...extraLinkData,
                            },
                        }, skipAccessControl: true,
                    },
                )

                if (err1 || !data1.obj || !data1.obj.id) {
                    const msg = '[error] Unable to create organization'
                    console.error(msg, err1)
                    throw new Error(msg)
                }

                const result = await findById('Organization', data1.obj.organization.id)
                await OrganizationService.emit('afterRegisterNewOrganization', result)
                return result
            },
        },
    ],
})

function accessAllowOnlyForLinkedUsers ({ authentication: { item: user } }) {
    if (!user) return false
    if (user.isAdmin) return {}
    return {
        organization: { userLinks_some: { user: { id: user.id } } },
    }
}

function connectByIdOnly (obj) {
    if (!obj) return false
    const keys = Object.keys(obj)
    if (keys.length !== 1) return false
    if (keys[0] !== 'connect') return false
    const connect = obj.connect
    if (!connect) return false
    if (!connect.id) return false
    const connect_keys = Object.keys(connect)
    if (connect_keys.length !== 1) return false
    return true
}

async function accessAllowOnlyForRoleOwner ({ operation, authentication: { item: user }, itemId, originalInput }) {
    if (!user || !user.id) return false
    if (user.isAdmin) return true
    let orgId
    if (operation === 'create' && originalInput) {
        if (!connectByIdOnly(originalInput.organization) || !connectByIdOnly(originalInput.user)) return false
        orgId = originalInput.organization.connect.id
    } else if ((operation === 'update' || operation === 'delete') && itemId) {
        const existingItem = await findById('OrganizationToUserLink', itemId)
        orgId = existingItem.organization
    } else {
        return false
    }
    const res = await find('OrganizationToUserLink', {
        organization: { id: orgId },
        user: { id: user.id },
        role: 'owner',
    })
    return res.length === 1
}

module.exports = {
    Organization,
    OrganizationToUserLink,
    OrganizationService,
}
