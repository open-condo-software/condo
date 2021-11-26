const { Virtual } = require('@keystonejs/fields')
const { pick } = require('lodash')

const { getById } = require('@core/keystone/schema')

const RESIDENT_ORGANIZATION_FIELD = {
    schemaDoc: 'Organization data, that is returned for current resident in mobile client',
    type: Virtual,
    extendGraphQLTypes: ['type residentOrganization { id: ID!, name: String, tin: String }'],
    graphQLReturnType: 'residentOrganization',
    resolver: async (item) => {
        if (!item.organization) { return null }
        const organization = await getById('Organization', item.organization)
        const resolvedTin = organization.tin ? organization.tin : organization.meta.inn
        return { ...pick(organization, ['id', 'name']), ...{ tin: resolvedTin } }
    },
    access: true,
}

module.exports = { RESIDENT_ORGANIZATION_FIELD }

