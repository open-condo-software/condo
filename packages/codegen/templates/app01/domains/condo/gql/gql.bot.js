const { generateGqlQueries } = require('@open-condo/codegen/generate.gql')

const { CONTACT_FIELDS: DEFAULT_CONTACT_FIELDS } = require('./fields')


const B2C_APP_PROPERTY_FIELDS = '{ address id deletedAt createdAt updatedAt }'
const B2CAppProperty = generateGqlQueries('B2CAppProperty', B2C_APP_PROPERTY_FIELDS)

const CONTACT_FIELDS = `{ ${DEFAULT_CONTACT_FIELDS} }`
const Contact = generateGqlQueries('Contact', CONTACT_FIELDS)

const ORGANIZATION_FIELDS = '{ id country name }'
const Organization = generateGqlQueries('Organization', ORGANIZATION_FIELDS)

const PROPERTY_FIELDS = '{ id name address type addressKey deletedAt createdAt updatedAt }'
const Property = generateGqlQueries('Property', PROPERTY_FIELDS)

const USER_FIELDS = '{ id }'
const User = generateGqlQueries('User', USER_FIELDS)


module.exports = {
    B2CAppProperty,
    Contact,
    Organization,
    Property,
    User,
}
