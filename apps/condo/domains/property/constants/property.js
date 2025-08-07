const { VALID_HOUSE_TYPES } = require('./common')

// "д" - "дом" or "к" - "корпус"
const validHouseTypes = VALID_HOUSE_TYPES

const buildingEmptyMapJson = {
    'dv': 1,
    'type': 'building',
    'sections': [],
    'parking': [],
}
// JSON from old maps that will be auto repaired after loading
// floors - didnt have index
// after moving from json schema to garphql type nulls will be in some unit's names
// preview field will disable editting
const autoFixBuildingMapJson = {
    'dv': 1,
    'type': 'building',
    'sections': [  {
        'id': '1',
        'type': 'section',
        'name': 'Подъезд №1',
        'preview': true,
        'floors': [
            {
                'id': '7',
                'type': 'floor',
                'name': '7',
                'preview': true,
                'units': [
                    {
                        'id': '25',
                        'label': '25',
                        'type': 'unit',
                        'name': null,
                        'preview': true,
                    },
                    {
                        'id': '26',
                        'type': 'unit',
                        'name': null,
                        'preview': true,
                    },
                    {
                        'id': '27',
                        'label': '27',
                        'type': 'unit',
                        'name': null,
                        'preview': true,
                    },
                    {
                        'id': '28',
                        'label': '28',
                        'type': 'unit',
                        'name': null,
                        'preview': true,
                    },
                ],
            },
        ],
    }],
}

const notValidBuildingMapJson = {
    'dv': 1,
    'type': 'building',
    'sections': [  {
        'id': '1',
        'type': 'section',
        'name': 'Подъезд №1',
        'floors': [
            {
                'id': '7',
                'type': 'floor',
                'name': '7',
                'units': [
                    {
                        'id': '25',
                        'label': '25',
                        'type': 'unit',
                    },
                    {
                        'id': '26',
                        'type': 'unit',
                    },
                    {
                        'id': '27',
                        'label': '27',
                        'type': 'unit',
                    },
                    {
                        'id': '28',
                        'label': '28',
                        'type': 'unit',
                    },
                ],
            },
        ],
    }],
}

const buildingMapJson = {
    'dv': 1,
    'type': 'building',
    'sections': [
        {
            'id': '1',
            'type': 'section',
            'index': 1,
            'name': 'Подъезд №1',
            'floors': [
                {
                    'id': '7',
                    'type': 'floor',
                    'index': 7,
                    'name': '7',
                    'units': [
                        {
                            'id': '25',
                            'label': '25',
                            'type': 'unit',
                        },
                        {
                            'id': '26',
                            'label': '26',
                            'type': 'unit',
                        },
                        {
                            'id': '27',
                            'label': '27',
                            'type': 'unit',
                        },
                        {
                            'id': '28',
                            'label': '28',
                            'type': 'unit',
                        },
                    ],
                },
                {
                    'id': '6',
                    'type': 'floor',
                    'index': 6,
                    'name': '6',
                    'units': [
                        {
                            'id': '21',
                            'label': '21',
                            'type': 'unit',
                        },
                        {
                            'id': '22',
                            'label': '22',
                            'type': 'unit',
                        },
                        {
                            'id': '23',
                            'label': '23',
                            'type': 'unit',
                        },
                        {
                            'id': '24',
                            'label': '24',
                            'type': 'unit',
                        },
                    ],
                },
                {
                    'id': '5',
                    'type': 'floor',
                    'index': 5,
                    'name': '5',
                    'units': [
                        {
                            'id': '17',
                            'label': '17',
                            'type': 'unit',
                        },
                        {
                            'id': '18',
                            'label': '18',
                            'type': 'unit',
                        },
                        {
                            'id': '19',
                            'label': '19',
                            'type': 'unit',
                        },
                        {
                            'id': '20',
                            'label': '20',
                            'type': 'unit',
                        },
                    ],
                },
                {
                    'id': '4',
                    'type': 'floor',
                    'index': 4,
                    'name': '4',
                    'units': [
                        {
                            'id': '13',
                            'label': '13',
                            'type': 'unit',
                        },
                        {
                            'id': '14',
                            'label': '14',
                            'type': 'unit',
                        },
                        {
                            'id': '15',
                            'label': '15',
                            'type': 'unit',
                        },
                        {
                            'id': '16',
                            'label': '16',
                            'type': 'unit',
                        },
                    ],
                },
                {
                    'id': '3',
                    'type': 'floor',
                    'index': 3,
                    'name': '3',
                    'units': [
                        {
                            'id': '9',
                            'label': '9',
                            'type': 'unit',
                        },
                        {
                            'id': '10',
                            'label': '10',
                            'type': 'unit',
                        },
                        {
                            'id': '11',
                            'label': '11',
                            'type': 'unit',
                        },
                        {
                            'id': '12',
                            'label': '12',
                            'type': 'unit',
                        },
                    ],
                },
                {
                    'id': '2',
                    'type': 'floor',
                    'index': 2,
                    'name': '2',
                    'units': [
                        {
                            'id': '5',
                            'label': '5',
                            'type': 'unit',
                        },
                        {
                            'id': '6',
                            'label': '6',
                            'type': 'unit',
                        },
                        {
                            'id': '7',
                            'label': '7',
                            'type': 'unit',
                        },
                        {
                            'id': '8',
                            'label': '8',
                            'type': 'unit',
                        },
                    ],
                },
                {
                    'id': '1',
                    'type': 'floor',
                    'index': 1,
                    'name': '1',
                    'units': [
                        {
                            'id': '1',
                            'label': '1',
                            'type': 'unit',
                        },
                        {
                            'id': '2',
                            'label': '2',
                            'type': 'unit',
                        },
                        {
                            'id': '3',
                            'label': '3',
                            'type': 'unit',
                        },
                        {
                            'id': '4',
                            'label': '4',
                            'type': 'unit',
                        },
                    ],
                },
            ],
        },
    ],
    'parking': [
        {
            'id': '1',
            'type': 'section',
            'index': 1,
            'name': 'Подъезд №1',
            'floors': [
                {
                    'id': '2',
                    'type': 'floor',
                    'index': 2,
                    'name': '2',
                    'units': [
                        {
                            'id': '5',
                            'label': '5',
                            'type': 'unit',
                        },
                        {
                            'id': '6',
                            'label': '6',
                            'type': 'unit',
                        },
                        {
                            'id': '7',
                            'label': '7',
                            'type': 'unit',
                        },
                        {
                            'id': '8',
                            'label': '8',
                            'type': 'unit',
                        },
                    ],
                },
                {
                    'id': '1',
                    'type': 'floor',
                    'index': 1,
                    'name': '1',
                    'units': [
                        {
                            'id': '1',
                            'label': '1',
                            'type': 'unit',
                        },
                        {
                            'id': '2',
                            'label': '2',
                            'type': 'unit',
                        },
                        {
                            'id': '3',
                            'label': '3',
                            'type': 'unit',
                        },
                        {
                            'id': '4',
                            'label': '4',
                            'type': 'unit',
                        },
                    ],
                },
            ],
        },
    ],
}

const buildingAddressMetaJson = {
    'postal_code': '115533',
    'country': 'Россия',
    'country_iso_code': 'RU',
    'region_fias_id': '0c5b2444-70a0-4932-980c-b4dc0d3f02b5',
    'region_kladr_id': '7700000000000',
    'region_iso_code': 'RU-MOW',
    'region_with_type': 'г Москва',
    'region_type': 'г',
    'region_type_full': 'город',
    'region': 'Москва',
    'city_fias_id': '0c5b2444-70a0-4932-980c-b4dc0d3f02b5',
    'city_kladr_id': '7700000000000',
    'city_with_type': 'г Москва',
    'city_type': 'г',
    'city_type_full': 'город',
    'city': 'Москва',
    'street_fias_id': 'fb4bcd3e-29ac-4a9e-809a-00378b5683f0',
    'street_kladr_id': '77000000000194300',
    'street_with_type': 'Нагатинская наб',
    'street_type': 'наб',
    'street_type_full': 'набережная',
    'street': 'Нагатинская',
    'house_fias_id': '9dd6056a-0b70-4451-8324-ca83d56c7266',
    'house_kladr_id': '7700000000019430123',
    'house_type': 'д',
    'house_type_full': 'дом',
    'house': '10',
    'block_type': 'к',
    'block_type_full': 'корпус',
    'block': '3',
    'fias_id': '9dd6056a-0b70-4451-8324-ca83d56c7266',
    'fias_code': '77000000000000019430123',
    'fias_level': '8',
    'fias_actuality_state': '0',
    'kladr_id': '7700000000019430123',
    'geoname_id': '524894',
    'capital_marker': '0',
    'okato': '45296571000',
    'oktmo': '45918000',
    'tax_office': '7725',
    'tax_office_legal': '7725',
    'geo_lat': '55.682935',
    'geo_lon': '37.64542',
    'qc_geo': '0',
    'address': 'г Москва, Нагатинская наб, д 10 к 3',
    'dv': 1,
}

const MIN_SECTIONS_TO_SHOW_FILTER = 2

// This number was picked empirically according to fact that no property exceeded this number
// Also it is due to performance limitation of current UI implementation, that will hang when user will try to enter more
const MAX_PROPERTY_FLOORS_COUNT = 100
const MAX_PROPERTY_UNITS_COUNT_PER_FLOOR = 300

module.exports = {
    buildingEmptyMapJson,
    buildingMapJson,
    buildingAddressMetaJson,
    notValidBuildingMapJson,
    validHouseTypes,
    autoFixBuildingMapJson,
    MIN_SECTIONS_TO_SHOW_FILTER,
    MAX_PROPERTY_FLOORS_COUNT,
    MAX_PROPERTY_UNITS_COUNT_PER_FLOOR,
}
