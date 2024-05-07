const COMMON_FIELDS = 'id dv sender { dv fingerprint } v deletedAt newId createdBy { id name } updatedBy { id name } createdAt updatedAt'

const ADDRESS_META_DATA_SUBFIELDS_QUERY_LIST = 'postal_code country country_iso_code federal_district region_fias_id region_kladr_id region_iso_code region_with_type region_type region_type_full region area_fias_id area_kladr_id area_with_type area_type area_type_full area city_fias_id city_kladr_id city_with_type city_type city_type_full city city_area city_district_fias_id city_district_kladr_id city_district_with_type city_district_type city_district_type_full city_district settlement_fias_id settlement_kladr_id settlement_with_type settlement_type settlement_type_full settlement street_fias_id street_kladr_id street_with_type street_type street_type_full street house_fias_id house_kladr_id house_type house_type_full house block_type block_type_full block entrance floor flat_fias_id flat_type flat_type_full flat flat_area square_meter_price flat_price postal_box fias_id fias_code fias_level fias_actuality_state kladr_id geoname_id capital_marker okato oktmo tax_office tax_office_legal timezone geo_lat geo_lon beltway_hit beltway_distance metro { name line distance } qc_geo qc_complete qc_house history_values unparsed_parts source qc'
const ADDRESS_META_SUBFIELDS_QUERY_LIST = `dv value unrestricted_value data { ${ADDRESS_META_DATA_SUBFIELDS_QUERY_LIST} }`

const PROPERTY_MAP_SECTION_FIELDS = 'id type index name preview floors { id type index name units { id type unitType name label preview } }'
const PROPERTY_MAP_JSON_FIELDS = `dv type sections { ${PROPERTY_MAP_SECTION_FIELDS} } parking { ${PROPERTY_MAP_SECTION_FIELDS} }`
const PROPERTY_FIELDS = `id name deletedAt address addressMeta { ${ADDRESS_META_SUBFIELDS_QUERY_LIST} } type map { ${PROPERTY_MAP_JSON_FIELDS} } addressKey`

const CONTACT_FIELDS = `organization { id name } property { id address addressMeta { ${ADDRESS_META_SUBFIELDS_QUERY_LIST} } } name phone unitName unitType email role { id name } isVerified ${COMMON_FIELDS}`


module.exports = {
    COMMON_FIELDS,
    ADDRESS_META_DATA_SUBFIELDS_QUERY_LIST,
    ADDRESS_META_SUBFIELDS_QUERY_LIST,
    PROPERTY_MAP_SECTION_FIELDS,
    PROPERTY_MAP_JSON_FIELDS,
    PROPERTY_FIELDS,
    CONTACT_FIELDS,
}
