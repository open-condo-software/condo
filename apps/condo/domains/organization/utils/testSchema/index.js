const faker = require('faker')
const { getRandomString } = require('@core/keystone/test.utils')
const { OrganizationEmployeeRole } = require('../../gql')

const { generateGQLTestUtils } = require('@condo/domains/common/utils/codegeneration/generate.test.utils')
const { OrganizationEmployee: OrganizationEmployeeGQL } = require('@condo/domains/organization/gql')
/* AUTOGENERATE MARKER <IMPORT> */

const OrganizationEmployee = generateGQLTestUtils(OrganizationEmployeeGQL)
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
  OrganizationEmployee, updateTestOrganizationEmployee, createTestOrganizationEmployeeRole
  /* AUTOGENERATE MARKER <EXPORTS> */
}