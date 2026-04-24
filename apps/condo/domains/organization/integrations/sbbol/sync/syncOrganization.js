
const get = require('lodash/get')

const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')

const { CUSTOMER_IMPORTANT_NOTE_TYPE } = require('@condo/domains/notification/constants/constants')
const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')
const { REGISTER_NEW_ORGANIZATION_MUTATION, ORGANIZATION_FIELDS } = require('@condo/domains/organization/gql')
const { dvSenderFields } = require('@condo/domains/organization/integrations/sbbol/constants')
const { Organization, OrganizationEmployee, OrganizationEmployeeRole } = require('@condo/domains/organization/utils/serverSchema')
const { createConfirmedEmployee } = require('@condo/domains/organization/utils/serverSchema/Organization')


const logger = getLogger('sbbol-sync-organization')

const CUSTOMER_EMAIL = conf.NOTIFY_ABOUT_NEW_ORGANIZATION_EMAIL

async function sendToCustomer (data) {
    if (CUSTOMER_EMAIL) {
        const { keystone } = getSchemaCtx('Message')

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
    const data = await userContext.executeGraphQL({
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

    const { data: { obj: createdOrganization } } = data

    const organization = await Organization.update(userContext, createdOrganization.id, {
        ...dvSenderFields,
        ...importInfo,
    }, ORGANIZATION_FIELDS)

    await sendToCustomer({ organization })

    return organization
}

/**
 * Creates or updates organization, according to data from SBBOL
 *
 * @param {KeystoneContext} context
 * @param user - imported user from external system (SBBOL)
 * @param userData prepared data at our side for saving user
 * @param authedUser - current authenticated user in the system
 * @param organizationInfo
 * @param dvSenderFields
 * @return {Promise<{organization, employee}>}
 */
const syncOrganization = async ({ context, user, userData, authedUser, organizationInfo, dvSenderFields }) => {
    const { context: adminContext } = context
    const importInfo = {
        importId: organizationInfo.importId,
        importRemoteSystem: organizationInfo.importRemoteSystem,
    }

    const employees = await OrganizationEmployee.getAll(adminContext, {
        user: { id: user.id },
        deletedAt: null,
    }, 'id organization { id tin meta deletedAt }', { sortBy: ['updatedAt_DESC'] })

    const [importedOrganization] = await Organization.getAll(adminContext, {
        ...importInfo,
        tin: `${organizationInfo.meta.inn}`,
        deletedAt: null,
    },
    'id features country tin name type',
    { first: 1 })

    if (!importedOrganization) {
        // Organization was not imported from SBBOL, but maybe, it was created before with the same TIN
        const employeeWithExistingOrganization = employees.find(( employee ) => employee.organization.tin === organizationInfo.meta.inn && employee.organization.deletedAt === null)
        const existingOrganization = get(employeeWithExistingOrganization, 'organization')

        // Check if the current authenticated user already has an organization with the same TIN
        // If yes, we'll update that organization instead of creating a new one
        let authedUserOrganization = null
        if (authedUser) {
            const [authedUserEmployee] = await OrganizationEmployee.getAll(adminContext, {
                user: { id: authedUser.id },
                organization: { tin: `${organizationInfo.meta.inn}`, deletedAt: null },
                deletedAt: null,
            }, 'id organization { id meta }', { first: 1, sortBy: ['updatedAt_DESC'] })
            
            authedUserOrganization = get(authedUserEmployee, 'organization')
        }

        if (authedUserOrganization) {
            // Update authedUser's existing organization
            const updatedOrganization = await Organization.update(adminContext, authedUserOrganization.id, {
                ...dvSenderFields,
                ...importInfo,
                meta: {
                    ...authedUserOrganization.meta,
                    ...organizationInfo.meta,
                },
            }, 'id features country tin name type')

            // Find or create employee for the imported user in this organization
            const existingEmployee = employees.find(employee => employee.organization.id === updatedOrganization.id)
            if (existingEmployee) {
                return { organization: updatedOrganization, employee: existingEmployee }
            } else {
                const allRoles = await OrganizationEmployeeRole.getAll(adminContext, {
                    organization: {
                        id: updatedOrganization.id,
                    },
                    name: 'employee.role.Administrator.name',
                    deletedAt: null,
                })
                if (!allRoles.length) {
                    throw new Error(`No Administrator role found for organization ${updatedOrganization.id}`)
                }

                const employee = await createConfirmedEmployee(adminContext, updatedOrganization, {
                    ...userData,
                    ...user,
                }, allRoles[0], dvSenderFields)
                return { organization: updatedOrganization, employee }
            }
        } else if (!existingOrganization) {
            const [existingOrganizationWithoutUser] = await Organization.getAll(adminContext, {
                tin: `${organizationInfo.meta.inn}`,
                deletedAt: null,
            }, 'id tin', { first: 1 })
            if (existingOrganizationWithoutUser) {
                logger.info({
                    msg: 'found existed organization with same tin without user',
                    data: {
                        tin: existingOrganizationWithoutUser?.tin,
                        organizationId: existingOrganizationWithoutUser?.id,
                    },
                })
            }
            
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
            }, 'id features country tin name type')

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
                deletedAt: null,
            })

            const employee = await createConfirmedEmployee(adminContext, importedOrganization, {
                ...userData,
                ...user,
            }, allRoles[0], dvSenderFields)
            return { organization: importedOrganization, employee }
        }
    }
    return { organization: importedOrganization, employee: employees.find(employee => (employee.organization.id === importedOrganization.id )) }
}

module.exports = {
    syncOrganization,
}