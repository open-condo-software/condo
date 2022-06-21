const { Virtual } = require('@keystonejs/fields')
const { pick } = require('lodash')

const { getById } = require('@core/keystone/schema')

const RESIDENT_ORGANIZATION_FIELD = {
    schemaDoc: 'Organization data, that is returned for current resident in mobile client',
    type: Virtual,
    extendGraphQLTypes: ['type residentOrganization { id: ID!, name: String, tin: String, country: String }'],
    graphQLReturnType: 'residentOrganization',
    resolver: async (item) => {
        if (!item.organization) { return null }

        const organization = await getById('Organization', item.organization)

        return pick(organization, ['id', 'name', 'tin', 'country'])
    },
    access: true,
}

module.exports = { RESIDENT_ORGANIZATION_FIELD }

