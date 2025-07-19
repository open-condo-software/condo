const axios = require('axios').default
const { get } = require('lodash')

const { execGqlWithoutAccess } = require('@open-condo/codegen/generate.server.utils')
const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')
const { getById } = require('@open-condo/keystone/schema')

const { DEFAULT_ROLES } = require('../../constants/common')
const { Organization, OrganizationEmployee } = require('../../gql')
const { SBBOL_FINGERPRINT_NAME } = require('../../integrations/sbbol/constants')

const { OrganizationEmployeeRole } = require('./index')


const logger = getLogger('sales-crm')
const SALES_CRM_WEBHOOKS_URL = (conf.SALES_CRM_WEBHOOKS_URL) ? JSON.parse(conf.SALES_CRM_WEBHOOKS_URL) : null
if (SALES_CRM_WEBHOOKS_URL && !SALES_CRM_WEBHOOKS_URL.organizations) {
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
    } catch (err) {
        logger.warn({ msg: 'Request to sales crm failed', err })
    }
}

module.exports = {
    createOrganization,
    createDefaultRoles,
    createConfirmedEmployee,
    pushOrganizationToSalesCRM,
}
