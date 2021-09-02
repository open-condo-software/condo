const Ajv = require('ajv')

/**
 * There is no official information about required status of these fields.
 * Requirement status of each column was determined empirically by its presence in data from production.
 * If a column in question is marked as required in GraphQL, but its value is blank,
 * following error will occur, for example, with blank column `house_fias_id`:
 * > Cannot return null for non-nullable field AddressMetaDataField.house_fias_id
 */
const AddressMetaDataFields = {
    postal_code: 'String',
    country: 'String!',
    country_iso_code: 'String!',
    federal_district: 'String',
    region_fias_id: 'String!',
    region_kladr_id: 'String!',
    region_iso_code: 'String!',
    region_with_type: 'String!',
    region_type: 'String!',
    region_type_full: 'String!',
    region: 'String!',
    area_fias_id: 'String',
    area_kladr_id: 'String',
    area_with_type: 'String',
    area_type: 'String',
    area_type_full: 'String',
    area: 'String',
    city_fias_id: 'String',
    city_kladr_id: 'String',
    city_with_type: 'String',
    city_type: 'String',
    city_type_full: 'String',
    city: 'String',
    city_area: 'String',
    city_district_fias_id: 'String',
    city_district_kladr_id: 'String',
    city_district_with_type: 'String',
    city_district_type: 'String',
    city_district_type_full: 'String',
    city_district: 'String',
    settlement_fias_id: 'String',
    settlement_kladr_id: 'String',
    settlement_with_type: 'String',
    settlement_type: 'String',
    settlement_type_full: 'String',
    settlement: 'String',
    street_fias_id: 'String',
    street_kladr_id: 'String!',
    street_with_type: 'String!',
    street_type: 'String!',
    street_type_full: 'String!',
    street: 'String!',
    house_fias_id: 'String',
    house_kladr_id: 'String',
    house_type: 'String',
    house_type_full: 'String!',
    house: 'String!',
    block_type: 'String',
    block_type_full: 'String',
    block: 'String',
    entrance: 'String',
    floor: 'String',
    flat_fias_id: 'String',
    flat_type: 'String',
    flat_type_full: 'String',
    flat: 'String',
    flat_area: 'String',
    square_meter_price: 'String',
    flat_price: 'String',
    postal_box: 'String',
    fias_id: 'String!',
    fias_code: 'String!',
    fias_level: 'String!',
    fias_actuality_state: 'String!',
    kladr_id: 'String!',
    geoname_id: 'String',
    capital_marker: 'String!',
    okato: 'String',
    oktmo: 'String',
    tax_office: 'String',
    tax_office_legal: 'String',
    timezone: 'String',
    geo_lat: 'String',
    geo_lon: 'String',
    beltway_hit: 'String',
    beltway_distance: 'String',
    metro: 'String',
    qc_geo: 'String',
    qc_complete: 'String',
    qc_house: 'String',
    history_values: '[String]',
    unparsed_parts: 'String',
    source: 'String',
    qc: 'String',
}

const render = (fields) => (
    Object.keys(fields).reduce((acc, key) => (
        acc + `${key}: ${fields[key]}\n`
    ), '')
)

const ADDRESS_META_FIELD_GRAPHQL_TYPES = `
    type AddressMetaDataField {
        ${render(AddressMetaDataFields)}
    }
    
    input AddressMetaDataFieldInput {
        ${render(AddressMetaDataFields)}
    }
    
    type AddressMetaField {
        dv: Int
        value: String!
        unrestricted_value: String!
        data: AddressMetaDataField!
    }
    
    input AddressMetaFieldInput {
        dv: Int!
        value: String!
        unrestricted_value: String!
        data: AddressMetaDataFieldInput!
    }
`

const AddressMetaJSONSchema = {
    'type': 'object',
    'properties': {
        'value': {
            'type': 'string',
        },
        'unrestricted_value': {
            'type': 'string',
        },
        'dv': {
            'type': 'integer',
        },
        'data': {
            'type': 'object',
            'properties': Object.assign({},
                ...Object.keys(AddressMetaDataFields).map((x) => ({ [x]: { 'type': ['string', 'null'] } })),
                { history_values: { type: ['array', 'null'], items: { type: 'string' } } }
            ),
            'additionalProperties': true,
            'required': Object.keys(AddressMetaDataFields),
        },
    },
    'additionalProperties': true,
    'required': [
        'value',
        'unrestricted_value',
        'data',
        'dv',
    ],
}


const ajv = new Ajv()
const addressMetaJsonValidator = ajv.compile(AddressMetaJSONSchema)

const ADDRESS_META_SUBFIELDS_QUERY_LIST = `dv value unrestricted_value data { ${Object.keys(AddressMetaDataFields).join(' ')} }`

module.exports = {
    ADDRESS_META_FIELD_GRAPHQL_TYPES,
    ADDRESS_META_SUBFIELDS_QUERY_LIST,
    AddressMetaDataFields,
    addressMetaJsonValidator,
}