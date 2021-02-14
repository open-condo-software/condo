const faker = require('faker')
const { v4: uuid } = require('uuid')

const { Wysiwyg } = require('@keystonejs/fields-wysiwyg-tinymce')
const { LocalFileAdapter } = require('@keystonejs/file-adapters')
const { File, Text, Relationship, Select, Uuid, Checkbox } = require('@keystonejs/fields')

const conf = require('@core/config')
const access = require('@core/keystone/access')
const { getByCondition, getById, GQLCustomSchema, GQLListSchema } = require('@core/keystone/schema')
const { Json } = require('@core/keystone/fields')
const { historical, versioned, uuided, tracked, softDeleted } = require('@core/keystone/plugins')

const { ORGANIZATION_OWNED_FIELD, SENDER_FIELD, DV_FIELD } = require('./_common')
const OrganizationGQL = require('./Organization.gql')
const { rules } = require('../access')
const countries = require('../constants/countries')

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
            options: countries.COUNTRIES,
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
        read: rules.canReadOrganizations,
        create: rules.canManageOrganizations,
        update: rules.canManageOrganizations,
        delete: false,
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
                read: true,
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
    plugins: [versioned(), tracked(), historical()],
    access: {
        read: rules.canReadEmployees,
        create: rules.canManageEmployees,
        update: rules.canManageEmployees,
        delete: rules.canManageEmployees,
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

        canManageOrganization: { type: Checkbox, defaultValue: false },
        canManageEmployees: { type: Checkbox, defaultValue: false },
        canManageRoles: { type: Checkbox, defaultValue: false },
    },
    plugins: [uuided(), versioned(), tracked(), historical()],
    access: {
        read: rules.canReadRoles,
        create: rules.canManageRoles,
        update: rules.canManageRoles,
        delete: rules.canManageRoles,
        auth: true,
    },
})

async function execGqlWithoutAccess (context, { query, variables, errorMessage = '[error] Internal Exec GQL Error', dataPath = 'obj' }) {
    if (!context) throw new Error('wrong context argument')
    if (!query) throw new Error('wrong query argument')
    if (!variables) throw new Error('wrong variables argument')
    const { errors, data } = await context.executeGraphQL({
        context: context.createContext({ skipAccessControl: true }),
        query,
        variables,
    })

    if (errors) {
        console.error(errors)
        const error = new Error(errorMessage)
        error.errors = errors
        throw error
    }

    if (!data || typeof data !== 'object') {
        throw new Error('wrong query result')
    }

    return data[dataPath]
}

async function createOrganization (context, data) {
    return await execGqlWithoutAccess(context, {
        query: OrganizationGQL.Organization.CREATE_OBJ_MUTATION,
        variables: { data },
        errorMessage: '[error] Create organization internal error',
        dataPath: 'obj',
    })
}

async function createAdminRole (context, organization, data) {
    if (!organization.id) throw new Error('wrong organization.id argument')
    if (!organization.country) throw new Error('wrong organization.country argument')
    const adminRoleName = countries[organization.country].adminRoleName
    return await execGqlWithoutAccess(context, {
        query: OrganizationGQL.OrganizationEmployeeRole.CREATE_OBJ_MUTATION,
        variables: {
            data: {
                organization: { connect: { id: organization.id } },
                canManageOrganization: true,
                canManageEmployees: true,
                canManageRoles: true,
                name: adminRoleName,
                ...data,
            },
        },
        errorMessage: '[error] Create admin role internal error',
        dataPath: 'obj',
    })
}

async function createConfirmedEmployee (context, organization, user, role, data) {
    if (!organization.id) throw new Error('wrong organization.id argument')
    if (!organization.country) throw new Error('wrong organization.country argument')
    if (!user.id) throw new Error('wrong user.id argument')
    if (!user.name) throw new Error('wrong user.name argument')
    if (!role.id) throw new Error('wrong role.id argument')
    return await execGqlWithoutAccess(context, {
        query: OrganizationGQL.OrganizationEmployee.CREATE_OBJ_MUTATION,
        variables: {
            data: {
                organization: { connect: { id: organization.id } },
                user: { connect: { id: user.id } },
                role: { connect: { id: role.id } },
                isAccepted: true,
                isRejected: false,
                name: user.name,
                email: user.email,
                phone: user.phone,
                ...data,
            },
        },
        errorMessage: '[error] Create employee internal error',
        dataPath: 'obj',
    })
}

const RegisterNewOrganizationService = new GQLCustomSchema('RegisterNewOrganizationService', {
    types: [
        {
            access: true,
            type: 'input RegisterNewOrganizationInput { dv: Int!, sender: JSON!, country: String!, name: String!, description: String!, meta: JSON!, avatar: Upload }',
        },
    ],
    mutations: [
        {
            access: rules.canRegisterNewOrganization,
            schema: 'registerNewOrganization(data: RegisterNewOrganizationInput!): Organization',
            resolver: async (parent, args, context, info, extra = {}) => {
                if (!context.authedItem.id) throw new Error('[error] User is not authenticated')
                const { data } = args
                const extraData = { dv: data.dv, sender: data.sender }

                const organization = await createOrganization(context, data)
                const role = await createAdminRole(context, organization, extraData)
                await createConfirmedEmployee(context, organization, context.authedItem, role, extraData)

                return await getById('Organization', organization.id)
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
            access: rules.canInviteEmployee,
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
            access: rules.canAcceptOrRejectEmployeeInvite,
            schema: 'acceptOrRejectOrganizationInviteByCode(code: String!, data: AcceptOrRejectOrganizationInviteInput!): OrganizationEmployee',
            resolver: async (parent, args, context, info, extra = {}) => {
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

                return await getById('OrganizationEmployee', acceptOrRejectData.obj.id)
            },
        },
        {
            access: rules.canAcceptOrRejectEmployeeInvite,
            schema: 'acceptOrRejectOrganizationInviteById(id: ID!, data: AcceptOrRejectOrganizationInviteInput!): OrganizationEmployee',
            resolver: async (parent, args, context, info, extra = {}) => {
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

                return await getById('OrganizationEmployee', acceptOrRejectData.obj.id)
            },
        },
    ],
})

module.exports = {
    Organization,
    OrganizationEmployee,
    OrganizationEmployeeRole,
    RegisterNewOrganizationService,
    InviteNewUserToOrganizationService,
    AcceptOrRejectOrganizationInviteService,
}
