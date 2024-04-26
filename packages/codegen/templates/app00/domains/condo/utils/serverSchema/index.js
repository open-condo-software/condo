const { isObject, isEmpty } = require('lodash')

const {
    serverGql: {
        B2BAppRole: B2BAppRoleGQL,
        Contact: ContactGQL,
        Organization: OrganizationGQL,
        OrganizationEmployee: OrganizationEmployeeGQL,
        Property: PropertyGQL,
        Resident: ResidentGQL,
        User: UserGQL,
        GET_ALL_PROPERTY_WITH_META_QUERY, SEND_B2C_APP_PUSH_MESSAGE_MUTATION,
    },
} = require('@{{name}}/domains/condo/gql')

const { generateCondoServerUtils, requestToCondo } = require('./generate.condo.server.utils')


const B2BAppRole = generateCondoServerUtils(B2BAppRoleGQL)
const Contact = generateCondoServerUtils(ContactGQL)
const Organization = generateCondoServerUtils(OrganizationGQL)
const OrganizationEmployee = generateCondoServerUtils(OrganizationEmployeeGQL)
const Property = generateCondoServerUtils(PropertyGQL)
const Resident = generateCondoServerUtils(ResidentGQL)
const User = generateCondoServerUtils(UserGQL)


async function getPropertyWithMeta (context, where) {
    if (!context) throw new Error('no context!')
    if (!isObject(where) || isEmpty(where)) throw new Error('where must be object with keys')

    const [property] = await requestToCondo(context, {
        query: GET_ALL_PROPERTY_WITH_META_QUERY,
        variables: {
            where: {
                ...where,
                deletedAt: null,
            },
        },
        errorMessage: '[error] Unable to query Properties',
        dataPath: 'objs',
    })

    return property || null
}

async function sendB2CAppPushMessage (context, data) {
    if (!context) throw new Error('no context!')
    if (!data) throw new Error('no data')

    return await requestToCondo(context, {
        query: SEND_B2C_APP_PUSH_MESSAGE_MUTATION,
        variables: { data },
        errorMessage: '[error] Unable to mutation SendB2CAppPushMessage',
        dataPath: 'result',
    })
}


module.exports = {
    B2BAppRole,
    Contact,
    Organization,
    OrganizationEmployee,
    Property,
    Resident,
    User,
    getPropertyWithMeta,
    sendB2CAppPushMessage,
}
