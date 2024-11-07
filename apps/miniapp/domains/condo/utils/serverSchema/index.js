const { generateCondoServerUtils } = require('@open-condo/codegen/generate.condo.server.utils')

const {
    serverGql: {
        B2BAppRole: B2BAppRoleGQL,
        Organization: OrganizationGQL,
        OrganizationEmployee: OrganizationEmployeeGQL,
        User: UserGQL,
    },
} = require('@miniapp/domains/condo/gql')

/* AUTOGENERATE MARKER <IMPORT> */

const B2BAppRole = generateCondoServerUtils(B2BAppRoleGQL)
const Organization = generateCondoServerUtils(OrganizationGQL)
const OrganizationEmployee = generateCondoServerUtils(OrganizationEmployeeGQL)
const User = generateCondoServerUtils(UserGQL)
/* AUTOGENERATE MARKER <CONST> */

module.exports = {
    B2BAppRole,
    Organization,
    OrganizationEmployee,
    User,
    /* AUTOGENERATE MARKER <EXPORTS> */
}
