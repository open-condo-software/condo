const axios = require('axios').default
const pino = require('pino')
const falsey = require('falsey')
const config = require('@core/config')
const { Organization, OrganizationEmployee } = require('../../gql')
const { OrganizationEmployeeRole } = require('./index')
const { execGqlWithoutAccess } = require('./utils')
const { getById } = require('@core/keystone/schema')
const { DEFAULT_ROLES } = require('@condo/domains/organization/constants/common')

const SALES_CRM_WEBHOOK_URL = typeof config.SALES_CRM_WEBHOOK_URL === 'string' && config.SALES_CRM_WEBHOOK_URL

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

async function createDefaultRoles (context, organization, data) {
    if (!context) throw new Error('no context')
    if (!organization.id) throw new Error('wrong organization.id argument')
    if (!organization.country) throw new Error('wrong organization.country argument')
    // TODO: place to another file?
    const tasks = Object.entries(DEFAULT_ROLES).map(([roleId, roleInfo]) =>
        OrganizationEmployeeRole.create(context, {
            organization: { connect: { id: organization.id } },
            ...roleInfo,
            ...data,
        }).then(x => ({ [roleId]: x }))
    )
    return await Promise.all(tasks).then(r => r.reduce((prev, curr) => ({ ...prev, ...curr })))
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

const salesCRMRequestLogger = pino({ name: 'sales_crm', enabled: falsey(process.env.DISABLE_LOGGING) })

async function pushToSalesCRM (organization) {
    if (!SALES_CRM_WEBHOOK_URL) {
        return salesCRMRequestLogger.warn('SALES_CRM_WEBHOOK_URL not specified correctly in config')
    }
    const { tin, name: orgName, createdBy } = organization
    const { phone: userPhone, name: userName, email } = await getById('User', createdBy.id)
    try {
        await axios.post(SALES_CRM_WEBHOOK_URL, {
            orgName,
            userName,
            userPhone,
            tin,
            email,
        })
    }
    catch (e) {
        salesCRMRequestLogger.warn('Request to sales crm failed', e)
    }
}
module.exports = {
    createOrganization,
    createOrganizationEmployee,
    updateOrganizationEmployee,
    createDefaultRoles,
    createConfirmedEmployee,
    findOrganizationEmployee,
    pushToSalesCRM,
}
