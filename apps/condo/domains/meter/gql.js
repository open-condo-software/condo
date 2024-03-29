/**
 * Generated by `createschema meter.MeterResource 'name:Text;'`
 * In most cases you should not change it by hands
 * Please, don't remove `AUTOGENERATE MARKER`s
 */
const { gql } = require('graphql-tag')

const { generateGqlQueries } = require('@open-condo/codegen/generate.gql')

const { ADDRESS_META_SUBFIELDS_QUERY_LIST } = require('@condo/domains/property/schema/fields/AddressMetaField')

const COMMON_FIELDS = 'id dv sender { dv fingerprint } v deletedAt newId createdBy { id name } updatedBy { id name } createdAt updatedAt'

const METER_RESOURCE_FIELDS = 'id name nameNonLocalized measure measureNonLocalized'
const METER_RESOURCE_FIELDS_ALL = `{ ${METER_RESOURCE_FIELDS} ${COMMON_FIELDS} }`
const MeterResource = generateGqlQueries('MeterResource', METER_RESOURCE_FIELDS_ALL)

const METER_READING_SOURCE_FIELDS = `{ type name nameNonLocalized ${COMMON_FIELDS} }`
const MeterReadingSource = generateGqlQueries('MeterReadingSource', METER_READING_SOURCE_FIELDS)

const METER_FIELDS = `{ number numberOfTariffs installationDate commissioningDate verificationDate nextVerificationDate controlReadingsDate sealingDate accountNumber organization { id } property { id address addressKey addressMeta { ${ADDRESS_META_SUBFIELDS_QUERY_LIST} } } unitName unitType place resource { ${METER_RESOURCE_FIELDS} } isAutomatic b2bApp { id name } b2cApp { id name } ${COMMON_FIELDS} }`
const Meter = generateGqlQueries('Meter', METER_FIELDS)

const METER_READING_FIELDS = `{ value1 value2 value3 value4 date meter ${METER_FIELDS} organization { id name } client { id } clientName clientEmail clientPhone contact { id name } source { id name type } ${COMMON_FIELDS} }`
const MeterReading = generateGqlQueries('MeterReading', METER_READING_FIELDS)

const EXPORT_METER_READINGS_QUERY = gql`
    query exportMeterReadings ($data: ExportMeterReadingsInput!) {
        result: exportMeterReadings (data: $data) { status, linkToFile }
    }
`

const METER_READING_FILTERS_FIELDS = '{ organization address accountNumber place number unitName resource clientName createdAt date verificationDate installationDate commissioningDate sealingDate controlReadingDate }'
const METER_READING_FILTER_TEMPLATE_FIELDS = `{ name employee { id } fields ${METER_READING_FILTERS_FIELDS} ${COMMON_FIELDS} }`
const MeterReadingFilterTemplate = generateGqlQueries('MeterReadingFilterTemplate', METER_READING_FILTER_TEMPLATE_FIELDS)

const PROPERTY_METER_FIELDS = `{ number numberOfTariffs installationDate commissioningDate verificationDate nextVerificationDate controlReadingsDate sealingDate isAutomatic organization { id name } property { id address addressMeta { ${ADDRESS_META_SUBFIELDS_QUERY_LIST} } } resource { ${METER_RESOURCE_FIELDS} } b2bApp { id } meta ${COMMON_FIELDS} }`
const PropertyMeter = generateGqlQueries('PropertyMeter', PROPERTY_METER_FIELDS)

const PROPERTY_METER_READING_FIELDS = `{ organization { id name } date meter ${PROPERTY_METER_FIELDS} value1 value2 value3 value4 source { id name type } ${COMMON_FIELDS} }`
const PropertyMeterReading = generateGqlQueries('PropertyMeterReading', PROPERTY_METER_READING_FIELDS)

const METER_REPORTING_PERIOD_FIELDS = `{ organization { id } property { id address addressMeta { ${ADDRESS_META_SUBFIELDS_QUERY_LIST} } } notifyStartDay notifyEndDay ${COMMON_FIELDS} }`
const MeterReportingPeriod = generateGqlQueries('MeterReportingPeriod', METER_REPORTING_PERIOD_FIELDS)

const DELETE_METER_AND_METER_READINGS_MUTATION = gql`
    mutation _internalDeleteMeterAndMeterReadings ($data: _internalDeleteMeterAndMeterReadingsInput!) {
        result: _internalDeleteMeterAndMeterReadings(data: $data) { status metersToDelete deletedMeters }
    }
`

const METER_RESOURCE_OWNER_FIELDS = `{ organization { id } resource { id } address addressKey ${COMMON_FIELDS} }`
const MeterResourceOwner = generateGqlQueries('MeterResourceOwner', METER_RESOURCE_OWNER_FIELDS)

const INTERNAL_DELETE_METER_READINGS_MUTATION = gql`
    mutation _internalDeleteMeterReadings ($data: _internalDeleteMeterReadingsInput!) {
        result: _internalDeleteMeterReadings(data: $data) { status toDelete deleted }
    }
`

const EXPORT_PROPERTY_METER_READINGS_QUERY = gql`
    query exportPropertyMeterReadings ($data: ExportPropertyMeterReadingsInput!) {
        result: exportPropertyMeterReadings (data: $data) { status, linkToFile }
    }
`

/* AUTOGENERATE MARKER <CONST> */

module.exports = {
    MeterResource,
    MeterReadingSource,
    Meter,
    MeterReading,
    EXPORT_METER_READINGS_QUERY,
    MeterReadingFilterTemplate,
    PropertyMeter,
    PropertyMeterReading,
    MeterReportingPeriod,
    DELETE_METER_AND_METER_READINGS_MUTATION,
    MeterResourceOwner,
    INTERNAL_DELETE_METER_READINGS_MUTATION,
    EXPORT_PROPERTY_METER_READINGS_QUERY,
/* AUTOGENERATE MARKER <EXPORTS> */
}

