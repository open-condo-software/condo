const { REGISTER_NEW_ORGANIZATION_MUTATION } = require('@condo/domains/organization/gql.js')
const { updateItem, getItems } = require('@keystonejs/server-side-graphql-client')
const { createConfirmedEmployee } = require('@condo/domains/organization/utils/serverSchema/Organization')
const { uniqBy } = require('lodash')

const getUserOrganizations = async ({ context, user }) => {
    const links = await getItems({
        ...context,
        listKey: 'OrganizationEmployee',
        where: {
            user: { id: user.id },
        },
        returnFields: 'organization { id meta }',
    })
    return uniqBy(links.map(link => link.organization), 'id')
}


const createOrganization = async ({ context, user, organizationInfo, dvSenderFields }) => {
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
            },
        },
        returnFields: 'id',
        ...context,
    })
    return organization
}

/**
 * Creates or updates organization, according to data from SBBOL
 *
 * @param {KeystoneContext} context
 * @param user
 * @param userInfo
 * @param organizationInfo
 * @param dvSenderFields
 * @return {Promise<*>}
 */
const syncOrganization = async ({ context, user, userInfo, organizationInfo, dvSenderFields }) => {
    const importInfo = {
        importId: organizationInfo.importId,
        importRemoteSystem: organizationInfo.importRemoteSystem,
    }
    const returnFields = 'id country meta importId importRemoteSystem'
    const userOrganizations = await getUserOrganizations({ context, user })
    const [organization] = await getItems({
        ...context,
        returnFields: returnFields,
        listKey: 'Organization',
        where: importInfo,
    })
    if (!organization) {
        // Organization was not imported from SBBOL, but maybe, it was created before with the same TIN
        const existingOrganization = userOrganizations.find(({ meta }) => meta.inn === organizationInfo.meta.inn)
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
                    },
                },
                returnFields: returnFields,
                ...context,
            })
            return updatedOrganization
        }
    } else {
        const isAlreadyEmployee = userOrganizations.find(org => org.id === organization.id)
        if (!isAlreadyEmployee) {
            const allRoles = await getItems({
                ...context,
                listKey: 'OrganizationEmployeeRole',
                where: {
                    organization: {
                        id: organization.id,
                    },
                    name: 'employee.role.Administrator.name',
                },
                returnFields: returnFields,
            })
            const { context: adminContext } = context
            await createConfirmedEmployee(adminContext, organization, {
                ...userInfo,
                ...user,
            }, allRoles[0], dvSenderFields)
        }
    }
    return organization
}

module.exports = {
    syncOrganization,
}