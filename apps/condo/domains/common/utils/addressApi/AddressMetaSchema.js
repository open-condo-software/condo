const AddressMetaJSONSchema = {
    'type': 'object',
    'properties': {
        'value': {
            'type': 'string',
        },
        'unrestricted_value': {
            'type': 'string',
        },
        'data': {
            'type': 'object',
            'properties': {
                'postal_code': {
                    'type': ['string', 'null'],
                },
                'country': {
                    'type': ['string', 'null'],
                },
                'country_iso_code': {
                    'type': ['string', 'null'],
                },
                'federal_district': {
                    'type': ['string', 'null'],
                },
                'region_fias_id': {
                    'type': ['string', 'null'],
                },
                'region_kladr_id': {
                    'type': ['string', 'null'],
                },
                'region_iso_code': {
                    'type': ['string', 'null'],
                },
                'region_with_type': {
                    'type': ['string', 'null'],
                },
                'region_type': {
                    'type': ['string', 'null'],
                },
                'region_type_full': {
                    'type': ['string', 'null'],
                },
                'region': {
                    'type': ['string', 'null'],
                },
                'area_fias_id': {
                    'type': ['string', 'null'],
                },
                'area_kladr_id': {
                    'type': ['string', 'null'],
                },
                'area_with_type': {
                    'type': ['string', 'null'],
                },
                'area_type': {
                    'type': ['string', 'null'],
                },
                'area_type_full': {
                    'type': ['string', 'null'],
                },
                'area': {
                    'type': ['string', 'null'],
                },
                'city_fias_id': {
                    'type': ['string', 'null'],
                },
                'city_kladr_id': {
                    'type': ['string', 'null'],
                },
                'city_with_type': {
                    'type': ['string', 'null'],
                },
                'city_type': {
                    'type': ['string', 'null'],
                },
                'city_type_full': {
                    'type': ['string', 'null'],
                },
                'city': {
                    'type': ['string', 'null'],
                },
                'city_area': {
                    'type': ['string', 'null'],
                },
                'city_district_fias_id': {
                    'type': ['string', 'null'],
                },
                'city_district_kladr_id': {
                    'type': ['string', 'null'],
                },
                'city_district_with_type': {
                    'type': ['string', 'null'],
                },
                'city_district_type': {
                    'type': ['string', 'null'],
                },
                'city_district_type_full': {
                    'type': ['string', 'null'],
                },
                'city_district': {
                    'type': ['string', 'null'],
                },
                'settlement_fias_id': {
                    'type': ['string', 'null'],
                },
                'settlement_kladr_id': {
                    'type': ['string', 'null'],
                },
                'settlement_with_type': {
                    'type': ['string', 'null'],
                },
                'settlement_type': {
                    'type': ['string', 'null'],
                },
                'settlement_type_full': {
                    'type': ['string', 'null'],
                },
                'settlement': {
                    'type': ['string', 'null'],
                },
                'street_fias_id': {
                    'type': ['string', 'null'],
                },
                'street_kladr_id': {
                    'type': ['string', 'null'],
                },
                'street_with_type': {
                    'type': ['string', 'null'],
                },
                'street_type': {
                    'type': ['string', 'null'],
                },
                'street_type_full': {
                    'type': ['string', 'null'],
                },
                'street': {
                    'type': ['string', 'null'],
                },
                'house_fias_id': {
                    'type': ['string', 'null'],
                },
                'house_kladr_id': {
                    'type': ['string', 'null'],
                },
                'house_cadnum': {
                    'type': ['string', 'null'],
                },
                'house_type': {
                    'type': ['string', 'null'],
                },
                'house_type_full': {
                    'type': ['string', 'null'],
                },
                'house': {
                    'type': ['string', 'null'],
                },
                'block_type': {
                    'type': ['string', 'null'],
                },
                'block_type_full': {
                    'type': ['string', 'null'],
                },
                'block': {
                    'type': ['string', 'null'],
                },
                'entrance': {
                    'type': ['string', 'null'],
                },
                'floor': {
                    'type': ['string', 'null'],
                },
                'flat_fias_id': {
                    'type': ['string', 'null'],
                },
                'flat_cadnum': {
                    'type': ['string', 'null'],
                },
                'flat_type': {
                    'type': ['string', 'null'],
                },
                'flat_type_full': {
                    'type': ['string', 'null'],
                },
                'flat': {
                    'type': ['string', 'null'],
                },
                'flat_area': {
                    'type': ['string', 'null'],
                },
                'square_meter_price': {
                    'type': ['string', 'null'],
                },
                'flat_price': {
                    'type': ['string', 'null'],
                },
                'postal_box': {
                    'type': ['string', 'null'],
                },
                'fias_id': {
                    'type': ['string', 'null'],
                },
                'fias_code': {
                    'type': ['string', 'null'],
                },
                'fias_level': {
                    'type': ['string', 'null'],
                },
                'fias_actuality_state': {
                    'type': ['string', 'null'],
                },
                'kladr_id': {
                    'type': ['string', 'null'],
                },
                'geoname_id': {
                    'type': ['string', 'null'],
                },
                'capital_marker': {
                    'type': ['string', 'null'],
                },
                'okato': {
                    'type': ['string', 'null'],
                },
                'oktmo': {
                    'type': ['string', 'null'],
                },
                'tax_office': {
                    'type': ['string', 'null'],
                },
                'tax_office_legal': {
                    'type': ['string', 'null'],
                },
                'timezone': {
                    'type': ['string', 'null'],
                },
                'geo_lat': {
                    'type': ['string', 'null'],
                },
                'geo_lon': {
                    'type': ['string', 'null'],
                },
                'beltway_hit': {
                    'type': ['string', 'null'],
                },
                'beltway_distance': {
                    'type': ['string', 'null'],
                },
                'metro': {
                    'type': ['string', 'null'],
                },
                'qc_geo': {
                    'type': ['string', 'null'],
                },
                'qc_complete': {
                    'type': ['string', 'null'],
                },
                'qc_house': {
                    'type': ['string', 'null'],
                },
                'history_values': {
                    'type': ['string', 'null'],
                },
                'unparsed_parts': {
                    'type': ['string', 'null'],
                },
                'source': {
                    'type': ['string', 'null'],
                },
                'qc': {
                    'type': ['string', 'null'],
                },
            },
            'additionalProperties': true,
            'required': [
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
                'house_cadnum',
                'house_type',
                'house_type_full',
                'house',
                'block_type',
                'block_type_full',
                'block',
                'entrance',
                'floor',
                'flat_fias_id',
                'flat_cadnum',
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
            ],
        },
    },
    'additionalProperties': true,
    'required': [
        'value',
        'unrestricted_value',
        'data',
    ],
}

module.exports = {
    AddressMetaJSONSchema,
}