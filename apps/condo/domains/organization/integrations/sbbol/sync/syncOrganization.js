
const get = require('lodash/get')

const conf = require('@open-condo/config')
const { getSchemaCtx } = require('@open-condo/keystone/schema')

const { loadListByChunks } = require('@condo/domains/common/utils/serverSchema')
const { CUSTOMER_IMPORTANT_NOTE_TYPE } = require('@condo/domains/notification/constants/constants')
const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')
const { REGISTER_NEW_ORGANIZATION_MUTATION } = require('@condo/domains/organization/gql')
const { dvSenderFields } = require('@condo/domains/organization/integrations/sbbol/constants')
const { Organization, OrganizationEmployee, OrganizationEmployeeRole } = require('@condo/domains/organization/utils/serverSchema')
const { createConfirmedEmployee } = require('@condo/domains/organization/utils/serverSchema/Organization')


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
    const { data: { obj: createdOrganization } } = await userContext.executeGraphQL({
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
 * @return {Promise<{organization, employee}>}
 */
const syncOrganization = async ({ context, user, userData, organizationInfo, dvSenderFields }) => {
    const { context: adminContext } = context
    const importInfo = {
        importId: organizationInfo.importId,
        importRemoteSystem: organizationInfo.importRemoteSystem,
    }

    const employees = await loadListByChunks({
        context: adminContext,
        list: OrganizationEmployee,
        chunkSize: 30,
        limit: 10000,
        where: {
            user: { id: user.id },
            deletedAt: null,
        },
        sortBy: ['updatedAt_DESC'],
    })

    const [importedOrganization] = await Organization.getAll(adminContext, {
        ...importInfo,
        tin: `${organizationInfo.meta.inn}`,
        deletedAt: null,
    }, { first: 1 })

    if (!importedOrganization) {
        // Organization was not imported from SBBOL, but maybe, it was created before with the same TIN
        const employeeWithExistingOrganization = employees.find(( employee ) => employee.organization.tin === organizationInfo.meta.inn && employee.organization.deletedAt === null)
        const existingOrganization = get(employeeWithExistingOrganization, 'organization')

        if (!existingOrganization) {
            const organization = await createOrganization({
                context,
                user,
                importInfo,
                organizationInfo,
            })
            const employee = await OrganizationEmployee.getOne(adminContext, {
                organization: { id: organization.id },
            })
            await sendToCustomer({ organization })

            return { organization, employee }
        } else {
            const updatedOrganization = await Organization.update(adminContext, existingOrganization.id, {
                ...dvSenderFields,
                ...importInfo,
                meta: {
                    ...existingOrganization.meta,
                    ...organizationInfo.meta,
                },
            })

            return { organization: updatedOrganization, employee: employeeWithExistingOrganization }
        }
    } else {
        const isAlreadyEmployee = employees.find(employee => employee.organization.id === importedOrganization.id)

        if (!isAlreadyEmployee) {
            const allRoles = await OrganizationEmployeeRole.getAll(adminContext, {
                organization: {
                    id: importedOrganization.id,
                },
                name: 'employee.role.Administrator.name',
            })

            const employee = await createConfirmedEmployee(adminContext, importedOrganization, {
                ...userData,
                ...user,
            }, allRoles[0], dvSenderFields)
            return { organization: importedOrganization, employee }
        }
    }
    return { organization: importedOrganization, employee: employees.find(employee => ( employee.organization.id === importedOrganization.id )) }
}

module.exports = {
    syncOrganization,
}