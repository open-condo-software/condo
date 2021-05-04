const { getRandomString } = require('@core/keystone/test.utils')

const { generateGQLTestUtils } = require('@condo/domains/common/utils/codegeneration/generate.test.utils')
const { OrganizationEmployee: OrganizationEmployeeGQL, OrganizationEmployeeRole: OrganizationEmployeeRoleGQL } = require('@condo/domains/organization/gql')
/* AUTOGENERATE MARKER <IMPORT> */

const OrganizationEmployee = generateGQLTestUtils(OrganizationEmployeeGQL)
const OrganizationEmployeeRole = generateGQLTestUtils(OrganizationEmployeeRoleGQL)
/* AUTOGENERATE MARKER <CONST> */

async function createTestOrganizationEmployeeRole (client, extraAttrs={}) {
  const attrs = {
    dv: 1,
    sender: { dv: 1, fingerprint: getRandomString() },
    ...extraAttrs
  }
  const obj = await OrganizationEmployeeRole.create(client, attrs)
  return [obj, attrs]
}

/* AUTOGENERATE MARKER <FACTORY> */

module.exports = {
  OrganizationEmployee, OrganizationEmployeeRole, createTestOrganizationEmployeeRole
  /* AUTOGENERATE MARKER <EXPORTS> */
}