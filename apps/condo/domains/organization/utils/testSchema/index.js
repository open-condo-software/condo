const { getRandomString } = require('@core/keystone/test.utils')

const { generateGQLTestUtils } = require('@condo/domains/common/utils/codegeneration/generate.test.utils')
const { OrganizationEmployee: OrganizationEmployeeGQL, OrganizationEmployeeRole: OrganizationEmployeeRoleGQL } = require('@condo/domains/organization/gql')
const { Organization: OrganizationGQL } = require('@condo/domains/organization/gql')
/* AUTOGENERATE MARKER <IMPORT> */

const OrganizationEmployee = generateGQLTestUtils(OrganizationEmployeeGQL)
const OrganizationEmployeeRole = generateGQLTestUtils(OrganizationEmployeeRoleGQL)
const Organization = generateGQLTestUtils(OrganizationGQL)
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

async function createTestOrganization (client, employees, extraAttrs = {}) {
    if (!client) throw new Error('no client')
    if (!employees || !employees.id) throw new Error('no employees.id')
    const sender = { dv: 1, fingerprint: faker.random.alphaNumeric(8) }

    // TODO(codegen): write createTestOrganization logic for generate fields

    const attrs = {
        dv: 1,
        sender,
        employees: { connect: { id: employees.id } },
        ...extraAttrs,
    }
    const obj = await Organization.create(client, attrs)
    return [obj, attrs]
}

async function updateTestOrganization (client, id, extraAttrs = {}) {
    if (!client) throw new Error('no client')
    if (!id) throw new Error('no id')
    const sender = { dv: 1, fingerprint: faker.random.alphaNumeric(8) }

    // TODO(codegen): check the updateTestOrganization logic for generate fields

    const attrs = {
        dv: 1,
        sender,
        ...extraAttrs,
    }
    const obj = await Organization.update(client, id, attrs)
    return [obj, attrs]
}

/* AUTOGENERATE MARKER <FACTORY> */

module.exports = {
  OrganizationEmployee, OrganizationEmployeeRole, createTestOrganizationEmployeeRole,
      Organization, createTestOrganization, updateTestOrganization,
/* AUTOGENERATE MARKER <EXPORTS> */
}