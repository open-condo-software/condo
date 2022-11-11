const axios = require('axios').default
const { get } = require('lodash')

const conf = require('@open-condo/config')
const { getById } = require('@open-condo/keystone/schema')
const { execGqlWithoutAccess } = require('@open-condo/codegen/generate.server.utils')

const { OrganizationEmployeeRole } = require('./index')
const { Organization, OrganizationEmployee } = require('../../gql')
const { DEFAULT_ROLES } = require('../../constants/common')
const { SBBOL_FINGERPRINT_NAME } = require('../../integrations/sbbol/constants')
const { getLogger } = require('@open-condo/keystone/logging')

const logger = getLogger('sales_crm')
const SALES_CRM_WEBHOOKS_URL = (conf.SALES_CRM_WEBHOOKS_URL) ? JSON.parse(conf.SALES_CRM_WEBHOOKS_URL) : null
if (SALES_CRM_WEBHOOKS_URL && !SALES_CRM_WEBHOOKS_URL.subscriptions && !SALES_CRM_WEBHOOKS_URL.organizations) {
    throw new Error('Wrong SALES_CRM_WEBHOOKS_URL value')
}

async function createOrganization (context, data) {
    return await execGqlWithoutAccess(context, {
        query: Organization.CREATE_OBJ_MUTATION,
        variables: { data },
        errorMessage: '[error] Create organization internal error',
        dataPath: 'obj',
    })
}

async function createDefaultRoles (context, organization, data) {
    if (!context) throw new Error('no context')
    if (!organization.id) throw new Error('wrong organization.id argument')
    if (!organization.country) throw new Error('wrong organization.country argument')
    // TODO: place to another file?
    const roles = await Promise.all(Object.entries(DEFAULT_ROLES).map(([roleId, roleInfo]) =>
        OrganizationEmployeeRole.create(context, {
            organization: { connect: { id: organization.id } },
            ...roleInfo,
            ...data,
        }).then(x => ({ [roleId]: x })),
    ))
    return roles.reduce((prev, curr) => ({ ...prev, ...curr }))
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

async function pushOrganizationToSalesCRM (organization) {
    if (!SALES_CRM_WEBHOOKS_URL) {
        logger.error({ msg: 'SALES_CRM_WEBHOOKS_URL is blank or has incorrect value', data: SALES_CRM_WEBHOOKS_URL })
        return
    }
    const { tin, name: orgName, createdBy } = organization
    const fingerprint = get(organization, ['sender', 'fingerprint'])
    const { phone: userPhone, name: userName, email } = await getById('User', createdBy.id)
    try {
        const data = {
            orgName,
            userName,
            userPhone,
            tin,
            email,
            fromSbbol: fingerprint === SBBOL_FINGERPRINT_NAME,
        }
        await axios.post(SALES_CRM_WEBHOOKS_URL.organizations, data)
        logger.info({ msg: 'Posted data to sales CRM', url: SALES_CRM_WEBHOOKS_URL.organizations, data })
    } catch (error) {
        logger.warn({ msg: 'Request to sales crm failed', error })
    }
}

async function pushSubscriptionActivationToSalesCRM (payerInn, startAt, finishAt, isTrial) {
    if (!SALES_CRM_WEBHOOKS_URL) {
        logger.error({ msg: 'SALES_CRM_WEBHOOKS_URL is blank or has incorrect value', data: SALES_CRM_WEBHOOKS_URL })
        return
    }
    try {
        await axios.post(SALES_CRM_WEBHOOKS_URL.subscriptions, {
            payerInn,
            startAt,
            finishAt,
            isTrial,
        })
    } catch (error) {
        logger.warn({ msg: 'Request to sales crm failed', error })
    }
}

module.exports = {
    createOrganization,
    createDefaultRoles,
    createConfirmedEmployee,
    findOrganizationEmployee,
    pushOrganizationToSalesCRM,
    pushSubscriptionActivationToSalesCRM,
}
