const faker = require('faker')
const { v4: uuid } = require('uuid')

const { Wysiwyg } = require('@keystonejs/fields-wysiwyg-tinymce')
const { LocalFileAdapter } = require('@keystonejs/file-adapters')
const { File, Text, Relationship, Select, Uuid, Checkbox } = require('@keystonejs/fields')

const conf = require('@core/config')
const access = require('@core/keystone/access')
const { findUser } = require('../utils/serverSchema/User')
const { findOrganizationEmployee, createConfirmedEmployee, createAdminRole, createOrganization, createOrganizationEmployee, updateOrganizationEmployee } = require('../utils/serverSchema/Organization')
const { getByCondition, getById, GQLCustomSchema, GQLListSchema } = require('@core/keystone/schema')
const { Json } = require('@core/keystone/fields')
const { historical, versioned, uuided, tracked, softDeleted } = require('@core/keystone/plugins')

const { ORGANIZATION_OWNED_FIELD, SENDER_FIELD, DV_FIELD } = require('./_common')
const { rules } = require('../access')
const countries = require('../constants/countries')
const { ALREADY_EXISTS_ERROR } = require('../constants/errors')
const { DV_UNKNOWN_VERSION_ERROR } = require('../constants/errors')
const { hasRequestAndDbFields, hasOneOfFields } = require('../utils/validation.utils')

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
    hooks: {
        validateInput: ({ resolvedData, existingItem, addValidationError }) => {
            if (!hasRequestAndDbFields(['dv', 'sender'], ['organization'], resolvedData, existingItem, addValidationError)) return
            if (!hasOneOfFields(['email', 'name', 'phone'], resolvedData, existingItem, addValidationError)) return
            const { dv } = resolvedData
            if (dv === 1) {
                // NOTE: version 1 specific translations. Don't optimize this logic
            } else {
                return addValidationError(`${DV_UNKNOWN_VERSION_ERROR}dv] Unknown \`dv\``)
            }
        },
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
        canManageIntegrations: { type: Checkbox, defaultValue: false },
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

const InviteNewOrganizationEmployeeService = new GQLCustomSchema('InviteNewOrganizationEmployeeService', {
    types: [
        {
            access: true,
            type: 'input InviteNewOrganizationEmployeeInput { dv: Int!, sender: JSON!, organization: OrganizationWhereUniqueInput!, email: String!, phone: String, name: String }',
        },
    ],
    mutations: [
        {
            access: rules.canInviteEmployee,
            schema: 'inviteNewOrganizationEmployee(data: InviteNewOrganizationEmployeeInput!): OrganizationEmployee',
            resolver: async (parent, args, context, info, extra = {}) => {
                if (!context.authedItem.id) throw new Error('[error] User is not authenticated')
                const { data } = args
                const { organization, email, name, ...restData } = data
                let user

                // Note: check is already exists (email + organization)
                {
                    const objs = await findOrganizationEmployee(context, {
                        email,
                        organization: { id: organization.id },
                    })

                    if (objs.length > 0) {
                        const msg = `${ALREADY_EXISTS_ERROR}] User is already invited in the organization`
                        console.error(msg)
                        throw new Error(msg)
                    }
                }

                if (!user) {
                    const objs = await findUser(context, { email })

                    if (objs && objs.length === 1) {
                        user = objs[0]
                    }
                }

                // Note: check is already exists (user + organization)
                if (user) {
                    const objs = await findOrganizationEmployee(context, {
                        user: { id: user.id },
                        organization: { id: organization.id },
                    })

                    if (objs.length > 0) {
                        const msg = `${ALREADY_EXISTS_ERROR}] User is already invited in the organization`
                        console.error(msg)
                        throw new Error(msg)
                    }
                }

                const obj = await createOrganizationEmployee(context, {
                    user: (user) ? { connect: { id: user.id } } : undefined,
                    organization: { connect: { id: organization.id } },
                    email,
                    name,
                    ...restData,
                })

                // TODO(pahaz): send email !?!?!
                console.log('Fake send security email!')

                return await getById('OrganizationEmployee', obj.id)
            },
        },
    ],
})

const AcceptOrRejectOrganizationInviteService = new GQLCustomSchema('AcceptOrRejectOrganizationInviteService', {
    types: [
        {
            access: true,
            type: 'input AcceptOrRejectOrganizationInviteInput { dv: Int!, sender: JSON!, isRejected: Boolean, isAccepted: Boolean }',
        },
    ],
    mutations: [
        {
            access: rules.canAcceptOrRejectEmployeeInvite,
            schema: 'acceptOrRejectOrganizationInviteById(id: ID!, data: AcceptOrRejectOrganizationInviteInput!): OrganizationEmployee',
            resolver: async (parent, args, context, info, extra = {}) => {
                if (!context.authedItem.id) throw new Error('[error] User is not authenticated')
                const { id, data } = args
                let { isRejected, isAccepted, ...restData } = data
                isRejected = isRejected || false
                isAccepted = isAccepted || false

                const obj = await updateOrganizationEmployee(context, id, { isRejected, isAccepted, ...restData })
                return await getById('OrganizationEmployee', obj.id)
            },
        },
        {
            access: rules.canAcceptOrRejectEmployeeInvite,
            schema: 'acceptOrRejectOrganizationInviteByCode(inviteCode: String!, data: AcceptOrRejectOrganizationInviteInput!): OrganizationEmployee',
            resolver: async (parent, args, context, info, extra = {}) => {
                if (!context.authedItem.id) throw new Error('[error] User is not authenticated')
                const { inviteCode, data } = args
                let { isRejected, isAccepted, ...restData } = data
                isRejected = isRejected || false
                isAccepted = isAccepted || false

                const link = await getByCondition('OrganizationEmployee', { inviteCode, user_is_null: true })

                const obj = await updateOrganizationEmployee(context, link.id, {
                    user: { connect: { id: context.authedItem.id } },
                    isRejected,
                    isAccepted,
                    ...restData,
                })

                return await getById('OrganizationEmployee', obj.id)
            },
        },
    ],
})

module.exports = {
    Organization,
    OrganizationEmployee,
    OrganizationEmployeeRole,
    RegisterNewOrganizationService,
    InviteNewOrganizationEmployeeService,
    AcceptOrRejectOrganizationInviteService,
}
