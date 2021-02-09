const faker = require('faker')
const { v4: uuid } = require('uuid')

const { Wysiwyg } = require('@keystonejs/fields-wysiwyg-tinymce')
const { LocalFileAdapter } = require('@keystonejs/file-adapters')
const { File, Text, Relationship, Select, Uuid, Checkbox } = require('@keystonejs/fields')

const conf = require('@core/config')
const access = require('@core/keystone/access')
const { getByCondition } = require('@core/keystone/schema')
const { getById } = require('@core/keystone/schema')
const { GQLCustomSchema } = require('@core/keystone/schema')
const { ORGANIZATION_OWNED_FIELD } = require('./_common')
const { SENDER_FIELD } = require('./_common')
const { DV_FIELD } = require('./_common')
const { COUNTRIES } = require('../country')
const { Json } = require('@core/keystone/fields')
const { GQLListSchema } = require('@core/keystone/schema')
const { historical, versioned, uuided, tracked, softDeleted } = require('@core/keystone/plugins')

const AVATAR_FILE_ADAPTER = new LocalFileAdapter({
    src: `${conf.MEDIA_ROOT}/orgavatars`,
    path: `${conf.MEDIA_URL}/orgavatars`,
})

const Organization = new GQLListSchema('Organization', {
    schemaDoc: 'B2B customer of the service, a legal entity or an association of legal entities (holding/group)',
    fields: {
        dv: DV_FIELD,
        sender: SENDER_FIELD,

        country: {
            schemaDoc: 'Country level specific',
            isRequired: true,
            type: Select,
            options: COUNTRIES,
        },
        name: {
            schemaDoc: 'Customer-friendly name',
            factory: () => faker.company.companyName(),
            type: Text,
            isRequired: true,
            kmigratorOptions: { null: false },
        },
        description: {
            schemaDoc: 'Customer-friendly description. Friendly text for employee and resident users',
            type: Wysiwyg,
            isRequired: false,
        },
        avatar: {
            schemaDoc: 'Customer-friendly avatar',
            type: File,
            isRequired: false,
            adapter: AVATAR_FILE_ADAPTER,
        },
        meta: {
            schemaDoc: 'Organization metadata. Depends on country level specific' +
                'Examples of data keys: `inn`, `kpp`',
            type: Json,
            isRequired: true,
        },
        employees: {
            type: Relationship,
            ref: 'OrganizationEmployee.organization',
            many: true,
        },
    },
    plugins: [uuided(), versioned(), tracked(), softDeleted(), historical()],
    access: {
        read: access.userIsAuthenticated,
        create: access.userIsAdmin,
        update: access.userIsAdmin,
        delete: access.userIsAdmin,
        auth: true,
    },
})

const OrganizationEmployee = new GQLListSchema('OrganizationEmployee', {
    schemaDoc: 'B2B customer employees',
    fields: {
        dv: DV_FIELD,
        sender: SENDER_FIELD,

        organization: { ...ORGANIZATION_OWNED_FIELD, ref: 'Organization.employees' },

        user: {
            schemaDoc: 'If user exists => invite is matched by email/phone (user can reject or accept it)',
            type: Relationship,
            ref: 'User',
            isRequired: false,
            knexOptions: { isNotNullable: false }, // Relationship only!
            kmigratorOptions: { null: true, on_delete: 'models.SET_NULL' },
            access: {
                update: access.userIsAdmin,
                create: access.userIsAdmin,
            },
        },

        inviteCode: {
            schemaDoc: 'Secret invite code (used for accept invite verification)',
            type: Uuid,
            defaultValue: () => uuid(),
            kmigratorOptions: { null: true, unique: true },
            access: {
                read: access.userIsAdmin,
                update: access.userIsAdmin,
                create: access.userIsAdmin,
            },
        },

        name: {
            factory: () => faker.fake('{{name.suffix}} {{name.firstName}} {{name.lastName}}'),
            type: Text,
        },
        email: {
            factory: () => faker.internet.exampleEmail().toLowerCase(),
            type: Text,
            isRequired: false,
            kmigratorOptions: { null: true },
            hooks: {
                resolveInput: async ({ resolvedData }) => {
                    return resolvedData['email'] && resolvedData['email'].toLowerCase()
                },
            },
        },
        phone: {
            type: Text,
            isRequired: false,
            kmigratorOptions: { null: true },
            hooks: {
                resolveInput: async ({ resolvedData }) => {
                    return resolvedData['phone'] && resolvedData['phone'].toLowerCase().replace(/\D/g, '')
                },
            },
        },

        role: {
            type: Relationship,
            ref: 'OrganizationEmployeeRole',
            isRequired: true,
            knexOptions: { isNotNullable: false }, // Relationship only!
            kmigratorOptions: { null: true, on_delete: 'models.SET_NULL' },
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
    plugins: [versioned(), tracked()],
    access: {
        read: access.userIsAuthenticated,
        create: access.userIsAdmin,
        update: accessAllowOnlyForRoleOwner,
        delete: accessAllowOnlyForRoleOwner,
        auth: true,
    },
})

const OrganizationEmployeeRole = new GQLListSchema('OrganizationEmployeeRole', {
    schemaDoc: 'Employee role name and access permissions',
    fields: {
        dv: DV_FIELD,
        sender: SENDER_FIELD,

        organization: ORGANIZATION_OWNED_FIELD,

        name: {
            type: Text,
            isRequired: true,
        },

        canManageUsers: { type: Checkbox, defaultValue: false },
    },
    plugins: [uuided(), versioned(), tracked(), softDeleted(), historical()],
    access: {
        read: access.userIsAuthenticated,
        create: access.userIsAdmin,
        update: access.userIsAdmin,
        delete: access.userIsAdmin,
        auth: true,
    },
})

const RegisterNewOrganizationService = new GQLCustomSchema('RegisterNewOrganizationService', {
    types: [
        {
            access: true,
            type: 'input RegisterNewOrganizationInput { dv: Int!, sender: JSON!, country: String!, name: String!, description: String!, meta: JSON!, avatar: Upload }',
        },
    ],
    mutations: [
        {
            access: access.userIsAuthenticated,
            schema: 'registerNewOrganization(data: RegisterNewOrganizationInput!): Organization',
            resolver: async (parent, args, context, info, extra = {}) => {
                if (!context.authedItem.id) throw new Error('[error] User is not authenticated')
                const { data } = args
                const extraLinkData = extra.extraLinkData || {}
                const extraOrganizationData = extra.extraOrganizationData || {}

                const { errors: createErrors, data: createData } = await context.executeGraphQL({
                    context: context.createContext({ skipAccessControl: true }),
                    query: `
                        mutation create($data: OrganizationEmployeeCreateInput!) {
                          obj: createOrganizationEmployee(data: $data) {
                            id
                            organization {
                              id
                            }
                          }
                        }
                    `,
                    variables: {
                        'data': {
                            dv: data.dv,
                            sender: data.sender,
                            organization: { create: { ...data, ...extraOrganizationData } },
                            user: { connect: { id: context.authedItem.id } },
                            isAccepted: true,
                            isRejected: false,
                            name: context.authedItem.name,
                            email: context.authedItem.email,
                            phone: context.authedItem.phone,
                            ...extraLinkData,
                        },
                    },
                })

                if (createErrors || !createData.obj || !createData.obj.id) {
                    const msg = '[error] Unable to create organization'
                    console.error(msg, createErrors)
                    throw new Error(msg)
                }

                return await getById('Organization', createData.obj.organization.id)
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
            schema: 'inviteNewUserToOrganization(data: InviteNewUserToOrganizationInput!): OrganizationEmployee',
            resolver: async (parent, args, context, info, extra = {}) => {
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
                            query findOrganizationEmployeeEmailConstraint($organizationId: ID!, $email: String!) {
                              objs: allOrganizationEmployees(where: {email: $email, organization: {id: $organizationId}}) {
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
                            query findOrganizationEmployeeConstraint($organizationId: ID!, $userId: ID!) {
                              objs: allOrganizationEmployees(where: {user: {id: $userId}, organization: {id: $organizationId}}) {
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
                        mutation create($data: OrganizationEmployeeCreateInput!) {
                          obj: createOrganizationEmployee(data: $data) {
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

                const result = await getById('OrganizationEmployee', createData.obj.id)
                await InviteNewUserToOrganizationService.emit('afterInviteNewUserToOrganization', {
                    parent, args, context, info, extra, result,
                })
                return result
            },
        },
    ],
})

InviteNewUserToOrganizationService.on('afterInviteNewUserToOrganization', ({ parent, args, context, info, extra, result }) => {
    // NOTE: send invite link by email!
    console.log('Fake send security email!', JSON.stringify(result))
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
            schema: 'acceptOrRejectOrganizationInviteByCode(code: String!, data: AcceptOrRejectOrganizationInviteInput!): OrganizationEmployee',
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

                const link = await getByCondition('OrganizationEmployee', { code, user_is_null: true })

                const { errors: acceptOrRejectErrors, data: acceptOrRejectData } = await context.executeGraphQL({
                    context: context.createContext({ skipAccessControl: true }),
                    query: `
                        mutation acceptOrReject($id: ID!, $data: OrganizationEmployeeUpdateInput!) {
                          obj: updateOrganizationEmployee(id: $id, data: $data) {
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

                const result = await getById('OrganizationEmployee', acceptOrRejectData.obj.id)
                await AcceptOrRejectOrganizationInviteService.emit('afterAcceptOrRejectOrganizationInviteInput', {
                    parent, args, context, info, extra, result,
                })
                return result
            },
        },
        {
            access: allowAccessForOwnInviteForAcceptOrRejectOrganizationInviteService,
            schema: 'acceptOrRejectOrganizationInviteById(id: ID!, data: AcceptOrRejectOrganizationInviteInput!): OrganizationEmployee',
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
                        mutation acceptOrReject($id: ID!, $data: OrganizationEmployeeUpdateInput!) {
                          obj: updateOrganizationEmployee(id: $id, data: $data) {
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

                const result = await getById('OrganizationEmployee', acceptOrRejectData.obj.id)
                await AcceptOrRejectOrganizationInviteService.emit('afterAcceptOrRejectOrganizationInviteInput', {
                    parent, args, context, info, extra, result,
                })
                return result
            },
        },
    ],
})

async function accessAllowOnlyForRoleOwner ({ operation, authentication: { item: user }, itemId, originalInput }) {
    if (!user || !user.id) return false
    if (user.isAdmin) return true
    let orgId
    if (operation === 'create' && originalInput) {
        if (!connectByIdOnly(originalInput.organization) || !connectByIdOnly(originalInput.user)) return false
        orgId = originalInput.organization.connect.id
    } else if ((operation === 'update' || operation === 'delete') && itemId) {
        const existingItem = await getById('OrganizationEmployee', itemId)
        orgId = existingItem.organization
    } else {
        return false
    }
    const res = await find('OrganizationEmployee', {
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
    const res = await find('OrganizationEmployee', {
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
    const link = await getById('OrganizationEmployee', id)
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
    const res = await find('OrganizationEmployee', { code, user_is_null: true })
    // TODO(pahaz): check is user email/phone is verified
    return res.length === 1
}

module.exports = {
    Organization,
    OrganizationEmployee,
    OrganizationEmployeeRole,
    RegisterNewOrganizationService,
    InviteNewUserToOrganizationService,
    AcceptOrRejectOrganizationInviteService,
}
