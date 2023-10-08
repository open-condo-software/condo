/**
 * @typedef {Object} NormalizedBuildingData
 * @property {string?} postal_code null
 * @property {string?} country "Россия"
 * @property {string?} country_iso_code "RU"
 * @property {string?} federal_district null
 * @property {string?} region_fias_id "0c5b2444-70a0-4932-980c-b4dc0d3f02b5"
 * @property {string?} region_kladr_id "7700000000000"
 * @property {string?} region_iso_code "RU-MOW"
 * @property {string?} region_with_type "г Москва"
 * @property {string?} region_type "г"
 * @property {string?} region_type_full "город"
 * @property {string?} region "Москва"
 * @property {string?} area_fias_id null
 * @property {string?} area_kladr_id null
 * @property {string?} area_with_type null
 * @property {string?} area_type null
 * @property {string?} area_type_full null
 * @property {string?} area null
 * @property {string?} city_fias_id "0c5b2444-70a0-4932-980c-b4dc0d3f02b5"
 * @property {string?} city_kladr_id "7700000000000"
 * @property {string?} city_with_type "г Москва"
 * @property {string?} city_type "г"
 * @property {string?} city_type_full "город"
 * @property {string?} city "Москва"
 * @property {string?} city_area null
 * @property {string?} city_district_fias_id null
 * @property {string?} city_district_kladr_id null
 * @property {string?} city_district_with_type null
 * @property {string?} city_district_type null
 * @property {string?} city_district_type_full null
 * @property {string?} city_district null
 * @property {string?} settlement_fias_id null
 * @property {string?} settlement_kladr_id null
 * @property {string?} settlement_with_type null
 * @property {string?} settlement_type null
 * @property {string?} settlement_type_full null
 * @property {string?} settlement null
 * @property {string?} street_fias_id "32fcb102-2a50-44c9-a00e-806420f448ea"
 * @property {string?} street_kladr_id "77000000000713400"
 * @property {string?} street_with_type "ул Хабаровская"
 * @property {string?} street_type "ул"
 * @property {string?} street_type_full "улица"
 * @property {string?} street "Хабаровская"
 * @property {string?} stead_fias_id null
 * @property {string?} stead_cadnum null
 * @property {string?} stead_type null
 * @property {string?} stead_type_full null
 * @property {string?} stead null
 * @property {string?} house_fias_id null
 * @property {string?} house_kladr_id null
 * @property {string?} house_cadnum null
 * @property {string?} house_type null
 * @property {string?} house_type_full null
 * @property {string?} house null
 * @property {string?} block_type null
 * @property {string?} block_type_full null
 * @property {string?} block null
 * @property {string?} entrance null
 * @property {string?} floor null
 * @property {string?} flat_fias_id null
 * @property {string?} flat_cadnum null
 * @property {string?} flat_type null
 * @property {string?} flat_type_full null
 * @property {string?} flat null
 * @property {string?} flat_area null
 * @property {string?} square_meter_price null
 * @property {string?} flat_price null
 * @property {string?} postal_box null
 * @property {string?} fias_id "32fcb102-2a50-44c9-a00e-806420f448ea"
 * @property {string?} fias_code null
 * @property {string?} fias_level "7"
 * @property {string?} fias_actuality_state "0"
 * @property {string?} kladr_id "77000000000713400"
 * @property {string?} geoname_id "524901"
 * @property {string?} capital_marker "0"
 * @property {string?} okato "45263564000"
 * @property {string?} oktmo "45305000"
 * @property {string?} tax_office "7718"
 * @property {string?} tax_office_legal "7718"
 * @property {string?} timezone null
 * @property {string?} geo_lat "55.821168"
 * @property {string?} geo_lon "37.82608"
 * @property {string?} beltway_hit null
 * @property {string?} beltway_distance null
 * @property {string?} metro null
 * @property {string?} divisions null
 * @property {string?} qc_geo "2"
 * @property {string?} qc_complete null
 * @property {string?} qc_house null
 * @property {Array<string>?} history_values: ["ул Черненко"]
 * @property {string?} unparsed_parts null
 * @property {string?} source null
 * @property {string?} qc null
 */

/**
 * @typedef {Object} ProviderData
 * @property {string} name
 * @property {Object} rawData
 */

/**
 * @typedef {Object} NormalizedBuilding
 * @property {string} value "г Москва, ул Хабаровская" | "injectionId:<uuid>"
 * @property {string} unrestricted_value "г Москва, ул Хабаровская"
 * @property {NormalizedBuildingData} data
 * @property {ProviderData} provider
 * @property {SuggestionHelpersType} [helpers]
 */
