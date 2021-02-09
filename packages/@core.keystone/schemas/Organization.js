const faker = require('faker')
const { v4: uuid } = require('uuid')
const { Text, Checkbox, Relationship, Uuid, Select } = require('@keystonejs/fields')
const { byTracking, atTracking } = require('@keystonejs/list-plugins')

const { GQLListSchema, GQLCustomSchema } = require('@core/keystone/schema')
const access = require('@core/keystone/access')
const { getByCondition } = require('../schema')
const { find } = require('../schema')
const { getById } = require('../schema')
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
        code: {
            factory: () => uuid(),
            type: Uuid,
            defaultValue: () => uuid(),
            schemaDoc: 'Secret invite code (used for accept invite verification)',
            kmigratorOptions: { null: true, unique: true },
            access: {
                read: access.userIsAdmin,
                update: access.userIsAdmin,
                create: access.userIsAdmin,
            },
        },
        organization: {
            factory: () => ({ create: Organization._factory() }),
            type: Relationship,
            ref: 'Organization.userLinks',
            isRequired: true,
            knexOptions: { isNotNullable: true }, // Relationship only!
            kmigratorOptions: { null: false },
            access: {
                update: access.userIsAdmin,
            },
        },
        email: {
            factory: () => faker.internet.exampleEmail().toLowerCase(),
            type: Text,
            isRequired: true,
            kmigratorOptions: { null: false },
            hooks: {
                resolveInput: async ({ resolvedData }) => {
                    return resolvedData['email'] && resolvedData['email'].toLowerCase()
                },
            },
        },
        name: {
            factory: () => faker.fake('{{name.suffix}} {{name.firstName}} {{name.lastName}}'),
            type: Text,
        },
        user: {  // if user exists => invite is accepted!
            factory: () => ({ create: User._factory() }),
            type: Relationship,
            ref: 'User',
            isRequired: true,
            knexOptions: { isNotNullable: false }, // Relationship only!
            kmigratorOptions: { null: true },
            access: {
                update: access.userIsAdmin,
            },
        },
        role: {
            type: Select,
            options: 'owner, member',
            defaultValue: 'member',
            isRequired: true,
            kmigratorOptions: { null: false },
        },
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
    access: {
        read: accessAllowOnlyForLinkedUsers,
        create: access.userIsAdmin,
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

const RegisterNewOrganizationService = new GQLCustomSchema('RegisterNewOrganizationService', {
    types: [
        {
            access: true,
            type: 'input RegisterNewOrganizationInput { name: String! }',
        },
    ],
    mutations: [
        {
            access: access.userIsAuthenticated,
            schema: 'registerNewOrganization(data: RegisterNewOrganizationInput!): Organization',
            resolver: async (parent, args, context, info, extra = {}) => {
                await RegisterNewOrganizationService.emit('beforeRegisterNewOrganization', {
                    parent, args, context, info, extra,
                })

                if (!context.authedItem.id) throw new Error('[error] User is not authenticated')
                const { data } = args
                const extraLinkData = extra.extraLinkData || {}
                const extraOrganizationData = extra.extraOrganizationData || {}

                const { errors: createErrors, data: createData } = await context.executeGraphQL({
                    context: context.createContext({ skipAccessControl: true }),
                    query: `
                        mutation create($data: OrganizationToUserLinkCreateInput!) {
                          obj: createOrganizationToUserLink(data: $data) {
                            id
                            organization {
                              id
                            }
                          }
                        }
                    `,
                    variables: {
                        'data': {
                            organization: { create: { ...data, ...extraOrganizationData } },
                            user: { connect: { id: context.authedItem.id } },
                            role: 'owner',
                            isAccepted: true,
                            isRejected: false,
                            name: context.authedItem.name,
                            email: context.authedItem.email,
                            ...extraLinkData,
                        },
                    },
                })

                if (createErrors || !createData.obj || !createData.obj.id) {
                    const msg = '[error] Unable to create organization'
                    console.error(msg, createErrors)
                    throw new Error(msg)
                }

                const result = await getById('Organization', createData.obj.organization.id)
                await RegisterNewOrganizationService.emit('afterRegisterNewOrganization', {
                    parent, args, context, info, extra, result,
                })
                return result
            },
        },
    ],
})

const InviteNewUserToOrganizationService = new GQLCustomSchema('InviteNewUserToOrganizationService', {
    types: [
        {
            access: true,
            type: 'input InviteNewUserToOrganizationInput { organization: OrganizationWhereUniqueInput!, email: String!, name: String }',
        },
    ],
    mutations: [
        {
            access: allowAccessForRoleOwnerForInviteNewUserToOrganizationService,
            schema: 'inviteNewUserToOrganization(data: InviteNewUserToOrganizationInput!): OrganizationToUserLink',
            resolver: async (parent, args, context, info, extra = {}) => {
                await InviteNewUserToOrganizationService.emit('beforeInviteNewUserToOrganization', {
                    parent, args, context, info, extra,
                })

                if (!context.authedItem.id) throw new Error('[error] User is not authenticated')
                const { data } = args
                const extraLinkData = extra.extraLinkData || {}
                const { organization, email, name, ...restData } = data
                let user = extraLinkData.user

                // Note: check is already exists (email + organization)
                {
                    const { errors, data } = await context.executeGraphQL({
                        context: context.createContext({ skipAccessControl: true }),
                        query: `
                            query findOrganizationToUserLinkEmailConstraint($organizationId: ID!, $email: String!) {
                              objs: allOrganizationToUserLinks(where: {email: $email, organization: {id: $organizationId}}) {
                                id
                              }
                            }
                        `,
                        variables: {
                            'organizationId': organization.id,
                            'email': email,
                        },
                    })

                    if (errors) {
                        const msg = '[error] Unable to check email link service'
                        console.error(msg, errors)
                        throw new Error(msg)
                    }

                    if (data.objs.length > 0) {
                        const msg = '[error.already.exists] User is already invited in the organization'
                        console.error(msg, errors)
                        throw new Error(msg)
                    }
                }

                if (!user) {
                    const { errors, data } = await context.executeGraphQL({
                        context: context.createContext({ skipAccessControl: true }),
                        query: `
                            query findUserByEmail($email: String!) {
                              objs: allUsers(where: {email: $email}) {
                                id
                                email
                                name
                              }
                            }
                        `,
                        variables: {
                            'email': email,
                        },
                    })

                    if (errors) {
                        const msg = '[error] Unable to access find user service'
                        console.error(msg, errors)
                        throw new Error(msg)
                    }

                    if (data && data.objs && data.objs.length === 1) {
                        user = data.objs[0]
                    }
                }

                // Note: check is already exists (user + organization)
                if (user) {
                    const { errors, data } = await context.executeGraphQL({
                        context: context.createContext({ skipAccessControl: true }),
                        query: `
                            query findOrganizationToUserLinkConstraint($organizationId: ID!, $userId: ID!) {
                              objs: allOrganizationToUserLinks(where: {user: {id: $userId}, organization: {id: $organizationId}}) {
                                id
                                role
                              }
                            }
                        `,
                        variables: {
                            'organizationId': organization.id,
                            'userId': user.id,
                        },
                    })

                    if (errors) {
                        const msg = '[error] Unable to check organization link service'
                        console.error(msg, errors)
                        throw new Error(msg)
                    }

                    if (data.objs.length > 0) {
                        const msg = '[error.already.exists] User is already invited in the organization'
                        console.error(msg, errors)
                        throw new Error(msg)
                    }
                }

                const { errors: createErrors, data: createData } = await context.executeGraphQL({
                    context: context.createContext({ skipAccessControl: true }),
                    query: `
                        mutation create($data: OrganizationToUserLinkCreateInput!) {
                          obj: createOrganizationToUserLink(data: $data) {
                            id
                            organization {
                              id
                            }
                          }
                        }
                    `,
                    variables: {
                        'data': {
                            user: (user) ? { connect: { id: user.id } } : undefined,
                            organization: { connect: { id: data.organization.id } },
                            email,
                            name,
                            ...restData,
                            ...extraLinkData,
                        },
                    },
                })

                if (createErrors || !createData.obj || !createData.obj.id) {
                    const msg = '[error] Unable to create organization link'
                    console.error(msg, createErrors)
                    throw new Error(msg)
                }

                const result = await getById('OrganizationToUserLink', createData.obj.id)
                await InviteNewUserToOrganizationService.emit('afterInviteNewUserToOrganization', {
                    parent, args, context, info, extra, result,
                })
                return result
            },
        },
    ],
})

const AcceptOrRejectOrganizationInviteService = new GQLCustomSchema('AcceptOrRejectOrganizationInviteService', {
    types: [
        {
            access: true,
            type: 'input AcceptOrRejectOrganizationInviteInput { isRejected: Boolean, isAccepted: Boolean }',
        },
    ],
    mutations: [
        {
            access: allowAccessForNotAssignedInvitesForAcceptOrRejectOrganizationInviteService,
            schema: 'acceptOrRejectOrganizationInviteByCode(code: String!, data: AcceptOrRejectOrganizationInviteInput!): OrganizationToUserLink',
            resolver: async (parent, args, context, info, extra = {}) => {
                await AcceptOrRejectOrganizationInviteService.emit('beforeAcceptOrRejectOrganizationInviteInput', {
                    parent, args, context, info, extra,
                })

                if (!context.authedItem.id) throw new Error('[error] User is not authenticated')
                const { code, data } = args
                const extraLinkData = extra.extraLinkData || {}
                let { isRejected, isAccepted, ...restData } = data
                isRejected = isRejected || false
                isAccepted = isAccepted || false

                const link = await getByCondition('OrganizationToUserLink', { code, user_is_null: true })

                const { errors: acceptOrRejectErrors, data: acceptOrRejectData } = await context.executeGraphQL({
                    context: context.createContext({ skipAccessControl: true }),
                    query: `
                        mutation acceptOrReject($id: ID!, $data: OrganizationToUserLinkUpdateInput!) {
                          obj: updateOrganizationToUserLink(id: $id, data: $data) {
                            id
                          }
                        }
                    `,
                    variables: {
                        id: link.id,
                        data: {
                            user: { connect: { id: context.authedItem.id } },
                            isRejected,
                            isAccepted,
                            ...restData,
                            ...extraLinkData,
                        },
                    },
                })

                if (acceptOrRejectErrors || !acceptOrRejectData.obj || !acceptOrRejectData.obj.id) {
                    const msg = '[error] Unable to update link state'
                    console.error(msg, acceptOrRejectErrors)
                    throw new Error(msg)
                }

                const result = await getById('OrganizationToUserLink', acceptOrRejectData.obj.id)
                await AcceptOrRejectOrganizationInviteService.emit('afterAcceptOrRejectOrganizationInviteInput', {
                    parent, args, context, info, extra, result,
                })
                return result
            },
        },
        {
            access: allowAccessForOwnInviteForAcceptOrRejectOrganizationInviteService,
            schema: 'acceptOrRejectOrganizationInviteById(id: ID!, data: AcceptOrRejectOrganizationInviteInput!): OrganizationToUserLink',
            resolver: async (parent, args, context, info, extra = {}) => {
                await AcceptOrRejectOrganizationInviteService.emit('beforeAcceptOrRejectOrganizationInviteInput', {
                    parent, args, context, info, extra,
                })
                if (!context.authedItem.id) throw new Error('[error] User is not authenticated')
                const { id, data } = args
                const extraLinkData = extra.extraLinkData || {}
                let { isRejected, isAccepted, ...restData } = data
                isRejected = isRejected || false
                isAccepted = isAccepted || false

                const { errors: acceptOrRejectErrors, data: acceptOrRejectData } = await context.executeGraphQL({
                    context: context.createContext({ skipAccessControl: true }),
                    query: `
                        mutation acceptOrReject($id: ID!, $data: OrganizationToUserLinkUpdateInput!) {
                          obj: updateOrganizationToUserLink(id: $id, data: $data) {
                            id
                          }
                        }
                    `,
                    variables: {
                        id,
                        data: { isRejected, isAccepted, ...restData, ...extraLinkData },
                    },
                })

                if (acceptOrRejectErrors || !acceptOrRejectData.obj || !acceptOrRejectData.obj.id) {
                    const msg = '[error] Unable to update link state'
                    console.error(msg, acceptOrRejectErrors)
                    throw new Error(msg)
                }

                const result = await getById('OrganizationToUserLink', acceptOrRejectData.obj.id)
                await AcceptOrRejectOrganizationInviteService.emit('afterAcceptOrRejectOrganizationInviteInput', {
                    parent, args, context, info, extra, result,
                })
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
        const existingItem = await getById('OrganizationToUserLink', itemId)
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

async function allowAccessForRoleOwnerForInviteNewUserToOrganizationService ({ authentication: { item: user }, args, context }) {
    if (!user || !user.id) return false
    if (user.isAdmin) return true
    if (!args || !args.data || !args.data.organization || !args.data.organization.id) return false
    const orgId = args.data.organization.id
    const res = await find('OrganizationToUserLink', {
        organization: { id: orgId },
        user: { id: user.id },
        role: 'owner',
    })
    return res.length === 1
}

async function allowAccessForOwnInviteForAcceptOrRejectOrganizationInviteService ({ authentication: { item: user }, args, context }) {
    if (!user || !user.id) return false
    if (user.isAdmin) return true
    if (!args || !args.id) return false
    const { id } = args
    const link = await getById('OrganizationToUserLink', id)
    const linkUser = await getById('User', link.user)
    if (!link || !linkUser) return false
    // TODO(pahaz): check is user email/phone is verified
    return String(link.user) === String(user.id)
}

async function allowAccessForNotAssignedInvitesForAcceptOrRejectOrganizationInviteService ({ authentication: { item: user }, args, context }) {
    if (!user || !user.id) return false
    if (user.isAdmin) return true
    if (!args || !args.code) return false
    const { code } = args
    const res = await find('OrganizationToUserLink', { code, user_is_null: true })
    // TODO(pahaz): check is user email/phone is verified
    return res.length === 1
}

module.exports = {
    Organization,
    OrganizationToUserLink,
    RegisterNewOrganizationService,
    InviteNewUserToOrganizationService,
    AcceptOrRejectOrganizationInviteService,
}
