const { getSchemaCtx } = require('@core/keystone/schema')
const { REGISTER_NEW_ORGANIZATION_MUTATION } = require('@condo/domains/organization/gql.js')
const { updateItem, getItems } = require('@keystonejs/server-side-graphql-client')
const { createConfirmedEmployee } = require('@condo/domains/organization/utils/serverSchema/Organization')
const { uniqBy } = require('lodash')
const conf = require('@core/config')
const { dvSenderFields } = require('../constants')
const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')
const { CUSTOMER_IMPORTANT_NOTE_TYPE } = require('@condo/domains/notification/constants/constants')

const CUSTOMER_EMAIL = conf.NOTIFY_ABOUT_NEW_ORGANIZATION_EMAIL

async function sendToCustomer (data) {
    if (CUSTOMER_EMAIL) {
        const { keystone } = await getSchemaCtx('Message')
        await sendMessage(keystone, {
            ...dvSenderFields,
            to: { email: CUSTOMER_EMAIL },
            lang: 'en',
            type: CUSTOMER_IMPORTANT_NOTE_TYPE,
            meta: { dv: 1, data },
        })
    }
}

const getUserOrganizations = async ({ context, user }) => {
    const links = await getItems({
        ...context,
        listKey: 'OrganizationEmployee',
        where: {
            user: { id: user.id },
        },
        returnFields: 'organization { id tin meta }',
    })
    return uniqBy(links.map(link => link.organization), 'id')
}


const createOrganization = async ({ context, user, organizationInfo }) => {
    const importInfo = {
        importId: organizationInfo.importId,
        importRemoteSystem: organizationInfo.importRemoteSystem,
    }
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
    const { obj: organization } = data
    await updateItem({
        listKey: 'Organization',
        item: {
            id: organization.id,
            data: {
                ...importInfo,
                ...dvSenderFields,
            },
        },
        returnFields: 'id',
        ...context,
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
    const importInfo = {
        importId: organizationInfo.importId,
        importRemoteSystem: organizationInfo.importRemoteSystem,
    }
    const returnFields = 'id country meta importId importRemoteSystem'
    const userOrganizations = await getUserOrganizations({ context, user })
    const [importedOrganization] = await getItems({
        ...context,
        returnFields: returnFields,
        listKey: 'Organization',
        where: importInfo,
    })
    if (!importedOrganization) {
        // Organization was not imported from SBBOL, but maybe, it was created before with the same TIN
        const existingOrganization = userOrganizations.find(({ tin }) => tin === organizationInfo.meta.inn)
        if (!existingOrganization) {
            const newOrganization = await createOrganization({ context, user, organizationInfo, dvSenderFields })
            return newOrganization
        } else {
            const updatedOrganization = await updateItem({
                listKey: 'Organization',
                item: {
                    id: existingOrganization.id,
                    data: {
                        ...importInfo,
                        meta: {
                            ...existingOrganization.meta,
                            ...organizationInfo.meta,
                        },
                        ...dvSenderFields,
                    },
                },
                returnFields: returnFields,
                ...context,
            })
            return updatedOrganization
        }
    } else {
        const isAlreadyEmployee = userOrganizations.find(org => org.id === importedOrganization.id)
        if (!isAlreadyEmployee) {
            const allRoles = await getItems({
                ...context,
                listKey: 'OrganizationEmployeeRole',
                where: {
                    organization: {
                        id: importedOrganization.id,
                    },
                    name: 'employee.role.Administrator.name',
                },
                returnFields: returnFields,
            })
            const { context: adminContext } = context
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