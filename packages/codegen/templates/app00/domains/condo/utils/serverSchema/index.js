const {
    serverGql: {
        B2BAppRole: B2BAppRoleGQL,
        Organization: OrganizationGQL,
        OrganizationEmployee: OrganizationEmployeeGQL,
        User: UserGQL,
    },
} = require('@{{name}}/domains/condo/gql')

const { generateCondoServerUtils } = require('@open-condo/codegen/generate.condo.server.utils')


const B2BAppRole = generateCondoServerUtils(B2BAppRoleGQL)
const Organization = generateCondoServerUtils(OrganizationGQL)
const OrganizationEmployee = generateCondoServerUtils(OrganizationEmployeeGQL)
const User = generateCondoServerUtils(UserGQL)


module.exports = {
    B2BAppRole,
    Organization,
    OrganizationEmployee,
    User,
}
