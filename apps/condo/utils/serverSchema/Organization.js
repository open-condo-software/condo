const { COUNTRIES, DEFAULT_ENGLISH_COUNTRY } = require('@condo/domains/common/constants/countries')
const { Organization, OrganizationEmployee, OrganizationEmployeeRole } = require('@condo/domains/organization/gql')
const { execGqlWithoutAccess } = require('./utils')

async function createOrganization (context, data) {
    return await execGqlWithoutAccess(context, {
        query: Organization.CREATE_OBJ_MUTATION,
        variables: { data },
        errorMessage: '[error] Create organization internal error',
        dataPath: 'obj',
    })
}

async function createOrganizationEmployee (context, data) {
    return await execGqlWithoutAccess(context, {
        query: OrganizationEmployee.CREATE_OBJ_MUTATION,
        variables: { data },
        errorMessage: '[error] Create organization employee internal error',
        dataPath: 'obj',
    })
}

async function updateOrganizationEmployee (context, id, data) {
    return await execGqlWithoutAccess(context, {
        query: OrganizationEmployee.UPDATE_OBJ_MUTATION,
        variables: { id, data },
        errorMessage: '[error] Update organization employee internal error',
        dataPath: 'obj',
    })
}

async function createAdminRole (context, organization, data) {
    if (!context) throw new Error('no context')
    if (!organization.id) throw new Error('wrong organization.id argument')
    if (!organization.country) throw new Error('wrong organization.country argument')
    const adminRoleName = (COUNTRIES[organization.country] || COUNTRIES[DEFAULT_ENGLISH_COUNTRY]).adminRoleName
    return await execGqlWithoutAccess(context, {
        query: OrganizationEmployeeRole.CREATE_OBJ_MUTATION,
        variables: {
            data: {
                organization: { connect: { id: organization.id } },
                canManageOrganization: true,
                canManageEmployees: true,
                canManageRoles: true,
                canManageIntegrations: true,
                canManageProperties: true,
                canManageTickets: true,
                canManageTicketContacts: true,
                name: adminRoleName,
                ...data,
            },
        },
        errorMessage: '[error] Create admin role internal error',
        dataPath: 'obj',
    })
}

async function createConfirmedEmployee (context, organization, user, role, data) {
    if (!context) throw new Error('no context')
    if (!organization.id) throw new Error('wrong organization.id argument')
    if (!organization.country) throw new Error('wrong organization.country argument')
    if (!user.id) throw new Error('wrong user.id argument')
    if (!user.name) throw new Error('wrong user.name argument')
    if (!role.id) throw new Error('wrong role.id argument')
    return await execGqlWithoutAccess(context, {
        query: OrganizationEmployee.CREATE_OBJ_MUTATION,
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

async function findOrganizationEmployee (context, query) {
    if (!context) throw new Error('no context')
    if (!query) throw new Error('no query')
    return await execGqlWithoutAccess(context, {
        query: OrganizationEmployee.GET_ALL_OBJS_QUERY,
        variables: {
            where: query,
        },
        errorMessage: '[error] Unable to query organization employees',
        dataPath: 'objs',
    })
}

module.exports = {
    createOrganization,
    createOrganizationEmployee,
    updateOrganizationEmployee,
    createAdminRole,
    createConfirmedEmployee,
    findOrganizationEmployee,
}
