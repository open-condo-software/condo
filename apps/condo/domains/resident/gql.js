/**
 * Generated by `createschema resident.Resident 'user:Relationship:User:CASCADE; organization:Relationship:Organization:PROTECT; property:Relationship:Property:PROTECT; billingAccount?:Relationship:BillingAccount:SET_NULL; unitName:Text;'`
 * In most cases you should not change it by hands
 * Please, don't remove `AUTOGENERATE MARKER`s
 */

const { gql } = require('graphql-tag')

const { generateGqlQueries } = require('@open-condo/codegen/generate.gql')

const { INVOICE_FIELDS } = require('@condo/domains/marketplace/gql')
const { METER_READING_MAX_VALUES_COUNT } = require('@condo/domains/meter/constants/constants')
const { ADDRESS_META_SUBFIELDS_QUERY_LIST } = require('@condo/domains/property/schema/fields/AddressMetaField')

const COMMON_FIELDS = 'id dv sender { dv fingerprint } v deletedAt newId createdBy { id name } updatedBy { id name } createdAt updatedAt'

const RESIDENT_ORGANIZATION_FIELDS = 'id name country tin'
const RESIDENT_PROPERTY_FIELDS = 'id name address'
const ORGANIZATION_FEATURES_FIELDS = 'hasBillingData hasMeters'
const PAYMENT_CATEGORIES_FIELDS = 'id categoryName billingName acquiringName'
const RESIDENT_FIELDS = `{ user { id name locale } organization { id name tin country } residentOrganization { ${RESIDENT_ORGANIZATION_FIELDS} } property { id createdAt deletedAt address addressKey  } residentProperty { ${RESIDENT_PROPERTY_FIELDS} } address addressKey addressMeta { ${ADDRESS_META_SUBFIELDS_QUERY_LIST} } unitName unitType ${COMMON_FIELDS} organizationFeatures { ${ORGANIZATION_FEATURES_FIELDS} } paymentCategories { ${PAYMENT_CATEGORIES_FIELDS} } }`
const Resident = generateGqlQueries('Resident', RESIDENT_FIELDS)

const REGISTER_RESIDENT_MUTATION = gql`
    mutation registerResident ($data: RegisterResidentInput!) {
        result: registerResident(data: $data) ${RESIDENT_FIELDS}
    }
`
const SERVICE_CONSUMER_FIELDS = `{ residentBillingAccount { id } residentAcquiringIntegrationContext { id integration { id hostUrl } } paymentCategory resident { id user { id locale } organization { id } unitType unitName deletedAt address property { id } } billingIntegrationContext { id lastReport deletedAt }  acquiringIntegrationContext { id status deletedAt } accountNumber ${COMMON_FIELDS} organization { id name tin country } isDiscovered }`
const ServiceConsumer = generateGqlQueries('ServiceConsumer', SERVICE_CONSUMER_FIELDS)

const REGISTER_SERVICE_CONSUMER_MUTATION = gql`
    mutation registerServiceConsumer ($data: RegisterServiceConsumerInput!) {
        obj: registerServiceConsumer(data: $data) ${SERVICE_CONSUMER_FIELDS}
    }
`

const SEND_MESSAGE_TO_RESIDENT_SCOPES_MUTATION = gql`
    mutation sendMessageToResidentScopes ($data: SendMessageToResidentScopesServiceInput!) {
        result: sendMessageToResidentScopes(data: $data) { status }
    }
`

const DISCOVER_SERVICE_CONSUMERS_MUTATION = gql`
    mutation discoverServiceConsumers ($data: DiscoverServiceConsumersInput!) {
        result: discoverServiceConsumers(data: $data) { status statistics { created residentsFound billingAccountsFound } }
    }
`

const GET_RESIDENT_EXISTENCE_BY_PHONE_AND_ADDRESS_QUERY = gql`
    query getGetResidentExistenceByPhoneAndAddress ($data: GetResidentExistenceByPhoneAndAddressInput!) {
        result: getResidentExistenceByPhoneAndAddress(data: $data) { hasResident hasResidentOnAddress }
    }
`

const REGISTER_RESIDENT_INVOICE_MUTATION = gql`
    mutation registerResidentInvoice ($data: RegisterResidentInvoiceInput!) {
        result: registerResidentInvoice(data: $data) ${INVOICE_FIELDS}
    }
`

const FIND_ORGANIZATIONS_BY_ADDRESS_QUERY = gql`
    query findOrganizationsByAddress ($data: FindOrganizationsByAddressInput!) {
        result: findOrganizationsByAddress(data: $data) { id name tin type receipts { accountNumber category balance routingNumber bankAccount address } meters { number resource accountNumber address } }
    }
`

const FIND_UNITS_BY_ADDRESS_QUERY = gql`
    query findUnitsByAddress ($data: FindUnitsByAddressInput!) {
        result: findUnitsByAddress (data: $data) { units { unitName, unitType } }
    }
`

/* AUTOGENERATE MARKER <CONST> */

const REGISTER_RESIDENT_SERVICE_CONSUMERS_MUTATION = gql`
    mutation registerResidentServiceConsumers ($data: RegisterResidentServiceConsumersInput!) {
        objs: registerResidentServiceConsumers(data: $data) ${SERVICE_CONSUMER_FIELDS}
    }
`

const SUGGEST_SERVICE_PROVIDER_QUERY = gql`
    query suggestServiceProvider($data: SuggestServiceProviderInput!) {
        result: suggestServiceProvider(data: $data) { tin name }
    }
`

module.exports = {
    Resident,
    REGISTER_RESIDENT_MUTATION,
    ServiceConsumer,
    REGISTER_SERVICE_CONSUMER_MUTATION,
    RESIDENT_ORGANIZATION_FIELDS,
    RESIDENT_PROPERTY_FIELDS,
    ORGANIZATION_FEATURES_FIELDS,
    PAYMENT_CATEGORIES_FIELDS,
    SEND_MESSAGE_TO_RESIDENT_SCOPES_MUTATION,
    DISCOVER_SERVICE_CONSUMERS_MUTATION,
    GET_RESIDENT_EXISTENCE_BY_PHONE_AND_ADDRESS_QUERY,
    REGISTER_RESIDENT_SERVICE_CONSUMERS_MUTATION,
    REGISTER_RESIDENT_INVOICE_MUTATION,
    FIND_ORGANIZATIONS_BY_ADDRESS_QUERY,
    SUGGEST_SERVICE_PROVIDER_QUERY,
    SERVICE_CONSUMER_FIELDS,
    FIND_UNITS_BY_ADDRESS_QUERY,
/* AUTOGENERATE MARKER <EXPORTS> */
}
