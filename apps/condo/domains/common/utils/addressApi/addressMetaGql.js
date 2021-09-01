const ADDRESS_META_FIELD_GRAPHQL_TYPES = `
    type AddressMetaDataField {
        postal_code: String!
        country: String!
        country_iso_code: String!
        federal_district: String
        region_fias_id: String!
        region_kladr_id: String!
        region_iso_code: String!
        region_with_type: String!
        region_type: String!
        region_type_full: String!
        region: String!
        area_fias_id: String
        area_kladr_id: String
        area_with_type: String
        area_type: String
        area_type_full: String
        area: String
        city_fias_id: String!
        city_kladr_id: String!
        city_with_type: String!
        city_type: String!
        city_type_full: String!
        city: String!
        city_area: String
        city_district_fias_id: String
        city_district_kladr_id: String
        city_district_with_type: String
        city_district_type: String
        city_district_type_full: String
        city_district: String
        settlement_fias_id: String
        settlement_kladr_id: String
        settlement_with_type: String
        settlement_type: String
        settlement_type_full: String
        settlement: String
        street_fias_id: String!
        street_kladr_id: String!
        street_with_type: String!
        street_type: String!
        street_type_full: String!
        street: String!
        house_fias_id: String!
        house_kladr_id: String!
        house_type: String!
        house_type_full: String!
        house: String!
        block_type: String
        block_type_full: String
        block: String
        entrance: String
        floor: String
        flat_fias_id: String
        flat_type: String
        flat_type_full: String
        flat: String
        flat_area: String
        square_meter_price: String
        flat_price: String
        postal_box: String
        fias_id: String!
        fias_code: String!
        fias_level: String!
        fias_actuality_state: String!
        kladr_id: String!
        geoname_id: String!
        capital_marker: String!
        okato: String!
        oktmo: String!
        tax_office: String!
        tax_office_legal: String!
        timezone: String
        geo_lat: String!
        geo_lon: String!
        beltway_hit: String
        beltway_distance: String
        metro: String
        qc_geo: String!
        qc_complete: String
        qc_house: String
        history_values: [String]
        unparsed_parts: String
        source: String
        qc: String
    }
    
    input AddressMetaDataFieldInput {
        postal_code: String!
        country: String!
        country_iso_code: String!
        federal_district: String
        region_fias_id: String!
        region_kladr_id: String!
        region_iso_code: String!
        region_with_type: String!
        region_type: String!
        region_type_full: String!
        region: String!
        area_fias_id: String
        area_kladr_id: String
        area_with_type: String
        area_type: String
        area_type_full: String
        area: String
        city_fias_id: String!
        city_kladr_id: String!
        city_with_type: String!
        city_type: String!
        city_type_full: String!
        city: String!
        city_area: String
        city_district_fias_id: String
        city_district_kladr_id: String
        city_district_with_type: String
        city_district_type: String
        city_district_type_full: String
        city_district: String
        settlement_fias_id: String
        settlement_kladr_id: String
        settlement_with_type: String
        settlement_type: String
        settlement_type_full: String
        settlement: String
        street_fias_id: String!
        street_kladr_id: String!
        street_with_type: String!
        street_type: String!
        street_type_full: String!
        street: String!
        house_fias_id: String!
        house_kladr_id: String!
        house_type: String!
        house_type_full: String!
        house: String!
        block_type: String
        block_type_full: String
        block: String
        entrance: String
        floor: String
        flat_fias_id: String
        flat_type: String
        flat_type_full: String
        flat: String
        flat_area: String
        square_meter_price: String
        flat_price: String
        postal_box: String
        fias_id: String!
        fias_code: String!
        fias_level: String!
        fias_actuality_state: String!
        kladr_id: String!
        geoname_id: String!
        capital_marker: String!
        okato: String!
        oktmo: String!
        tax_office: String!
        tax_office_legal: String!
        timezone: String
        geo_lat: String!
        geo_lon: String!
        beltway_hit: String
        beltway_distance: String
        metro: String
        qc_geo: String!
        qc_complete: String
        qc_house: String
        history_values: [String]
        unparsed_parts: String
        source: String
        qc: String
    }
    
    type AddressMetaField {
        dv: Int!
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

const ADDRESS_META_DATA_FIELDS = [
    'postal_code',
    'country',
    'country_iso_code',
    'federal_district',
    'region_fias_id',
    'region_kladr_id',
    'region_iso_code',
    'region_with_type',
    'region_type',
    'region_type_full',
    'region',
    'area_fias_id',
    'area_kladr_id',
    'area_with_type',
    'area_type',
    'area_type_full',
    'area',
    'city_fias_id',
    'city_kladr_id',
    'city_with_type',
    'city_type',
    'city_type_full',
    'city',
    'city_area',
    'city_district_fias_id',
    'city_district_kladr_id',
    'city_district_with_type',
    'city_district_type',
    'city_district_type_full',
    'city_district',
    'settlement_fias_id',
    'settlement_kladr_id',
    'settlement_with_type',
    'settlement_type',
    'settlement_type_full',
    'settlement',
    'street_fias_id',
    'street_kladr_id',
    'street_with_type',
    'street_type',
    'street_type_full',
    'street',
    'house_fias_id',
    'house_kladr_id',
    'house_type',
    'house_type_full',
    'house',
    'block_type',
    'block_type_full',
    'block',
    'entrance',
    'floor',
    'flat_fias_id',
    'flat_type',
    'flat_type_full',
    'flat',
    'flat_area',
    'square_meter_price',
    'flat_price',
    'postal_box',
    'fias_id',
    'fias_code',
    'fias_level',
    'fias_actuality_state',
    'kladr_id',
    'geoname_id',
    'capital_marker',
    'okato',
    'oktmo',
    'tax_office',
    'tax_office_legal',
    'timezone',
    'geo_lat',
    'geo_lon',
    'beltway_hit',
    'beltway_distance',
    'metro',
    'qc_geo',
    'qc_complete',
    'qc_house',
    'history_values',
    'unparsed_parts',
    'source',
    'qc',
]

const ADDRESS_META_SUBFIELDS_QUERY_LIST = `dv value unrestricted_value data { ${ADDRESS_META_DATA_FIELDS.join(' ')} }`

module.exports = {
    ADDRESS_META_FIELD_GRAPHQL_TYPES,
    ADDRESS_META_SUBFIELDS_QUERY_LIST,
    ADDRESS_META_DATA_FIELDS,
}