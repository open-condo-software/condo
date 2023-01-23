
const get = require('lodash/get')

const conf = require('@open-condo/config')
const { getSchemaCtx } = require('@open-condo/keystone/schema')

const { CUSTOMER_IMPORTANT_NOTE_TYPE } = require('@condo/domains/notification/constants/constants')
const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')
const { REGISTER_NEW_ORGANIZATION_MUTATION } = require('@condo/domains/organization/gql')
const { Organization, OrganizationEmployee, OrganizationEmployeeRole } = require('@condo/domains/organization/utils/serverSchema')
const { createConfirmedEmployee } = require('@condo/domains/organization/utils/serverSchema/Organization')



const { dvSenderFields } = require('../constants')


const CUSTOMER_EMAIL = conf.NOTIFY_ABOUT_NEW_ORGANIZATION_EMAIL

async function sendToCustomer (data) {
    if (CUSTOMER_EMAIL) {
        const { keystone } = await getSchemaCtx('Message')

        await sendMessage(keystone, {
            ...dvSenderFields,
            to: { email: CUSTOMER_EMAIL },
            type: CUSTOMER_IMPORTANT_NOTE_TYPE,
            meta: { dv: 1, data },
        })
    }
}

const createOrganization = async ({ context, user, importInfo, organizationInfo }) => {
    const userContext = await context.keystone.createContext({
        authentication: {
            item: user,
            listKey: 'User',
        },
    })
    const { data } = await userContext.executeGraphQL({
        context: userContext,
        query: REGISTER_NEW_ORGANIZATION_MUTATION,
        variables: {
            data: {
                ...dvSenderFields,
                country: organizationInfo.country,
                name: organizationInfo.name,
                meta: organizationInfo.meta,
                tin: `${organizationInfo.meta.inn}`,
            },
        },
    })
    const { obj: createdOrganization } = data
    const organization = await Organization.update(userContext, createdOrganization.id, {
        ...dvSenderFields,
        ...importInfo,
    })

    await sendToCustomer({ organization })

    return organization
}

/**
 * Creates or updates organization, according to data from SBBOL
 *
 * @param {KeystoneContext} context
 * @param user
 * @param userData prepared data at our side for saving user
 * @param organizationInfo
 * @param dvSenderFields
 * @return {Promise<*>}
 */
const syncOrganization = async ({ context, user, userData, organizationInfo, dvSenderFields }) => {
    const { context: adminContext } = context
    const importInfo = {
        importId: organizationInfo.importId,
        importRemoteSystem: organizationInfo.importRemoteSystem,
    }

    const employees = await OrganizationEmployee.getAll(adminContext, {
        user: { id: user.id },
    }, { sortBy: ['updatedAt_DESC'], first: 100 })

    const [importedOrganization] = await Organization.getAll(adminContext, {
        ...importInfo,
        tin: `${organizationInfo.meta.inn}`,
    }, { first: 1 })

    if (!importedOrganization) {
        // Organization was not imported from SBBOL, but maybe, it was created before with the same TIN
        const existingOrganization = get(employees.find(( employee ) => employee.organization.tin === organizationInfo.meta.inn && employee.organization.deletedAt === null), 'organization')

        if (!existingOrganization) {
            const organization = await createOrganization({
                context,
                user,
                importInfo,
                organizationInfo,
            })

            await sendToCustomer({ organization })

            return organization
        } else {
            return await Organization.update(adminContext, existingOrganization.id, {
                ...dvSenderFields,
                ...importInfo,
                meta: {
                    ...existingOrganization.meta,
                    ...organizationInfo.meta,
                },
            })
        }
    } else {
        const isAlreadyEmployee = employees.find(employee => employee.organization.id === importedOrganization.id)

        if (!isAlreadyEmployee) {
            const allRoles = await OrganizationEmployeeRole.getAll(adminContext, {
                organization: {
                    id: importedOrganization.id,
                },
                name_in: 'employee.role.Administrator.name',
            })

            await createConfirmedEmployee(adminContext, importedOrganization, {
                ...userData,
                ...user,
            }, allRoles[0], dvSenderFields)
        }
    }
    return importedOrganization
}

module.exports = {
    syncOrganization,
}