const axios = require('axios').default
const pino = require('pino')
const falsey = require('falsey')
const config = require('@core/config')
const { Organization, OrganizationEmployee } = require('../../gql')
const { OrganizationEmployeeRole } = require('./index')
const { execGqlWithoutAccess } = require('./utils')
const { getById } = require('@core/keystone/schema')
const { DEFAULT_ROLES } = require('@condo/domains/organization/constants/common')

const AMOCRM_WEBHOOK_URL = typeof config.AMOCRM_WEBHOOK_URL === 'string' && config.AMOCRM_WEBHOOK_URL

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

const amoCRMRequestLogger = pino({ name: 'amocrm', enabled: falsey(process.env.DISABLE_LOGGING) })

async function pushToAmoCRM (organization) {
    if (!AMOCRM_WEBHOOK_URL) {
        return amoCRMRequestLogger.warn('AMOCRM_WEBHOOK_URLS not specified correctly in config')
    }
    const { tin, name: orgName, createdBy } = organization
    const { phone: userPhone, name: userName, email } = await getById('User', createdBy.id)
    try {
        await axios.post(AMOCRM_WEBHOOK_URL, {
            orgName,
            userName,
            userPhone,
            tin,
            email,
        })
    }
    catch (e) {
        amoCRMRequestLogger.warn('Request to amoCRM failed', e)
    }
}
module.exports = {
    createOrganization,
    createOrganizationEmployee,
    updateOrganizationEmployee,
    createDefaultRoles,
    createConfirmedEmployee,
    findOrganizationEmployee,
    pushToAmoCRM,
}
