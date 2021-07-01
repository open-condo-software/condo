import { AddressMeta } from '@condo/domains/common/utils/addressApi/AddressMeta'

// "д" - "дом" or "к" - "корпус"
const validHouseTypes: AddressMeta['data']['house_type'][] = ['д', 'к', 'стр']

const buildingEmptyMapJson = {
    'dv': 1,
    'type': 'building',
    'sections': [],
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

const demoProperty = {
    addressMeta: { 'dv': 1, 'data': { 'qc': null, 'area': null, 'city': 'Екатеринбург', 'flat': null, 'block': null, 'floor': null, 'house': '103', 'metro': null, 'okato': '65401000000', 'oktmo': '65701000001', 'qc_geo': '0', 'region': 'Свердловская', 'source': null, 'street': 'Щорса', 'country': 'Россия', 'fias_id': 'c2341fbb-23c3-40ec-a946-a4e67a9f13a2', 'geo_lat': '56.807407', 'geo_lon': '60.60458', 'entrance': null, 'kladr_id': '6600000100012950036', 'qc_house': null, 'timezone': null, 'area_type': null, 'city_area': null, 'city_type': 'г', 'fias_code': '66000001000000012950036', 'flat_area': null, 'flat_type': null, 'block_type': null, 'fias_level': '8', 'flat_price': null, 'geoname_id': '1486209', 'house_type': 'д', 'postal_box': null, 'settlement': null, 'tax_office': '6679', 'beltway_hit': null, 'flat_cadnum': null, 'postal_code': '620144', 'qc_complete': null, 'region_type': 'обл', 'street_type': 'ул', 'area_fias_id': null, 'city_fias_id': '2763c110-cb8b-416a-9dac-ad28a55b4402', 'flat_fias_id': null, 'house_cadnum': null, 'area_kladr_id': null, 'city_district': null, 'city_kladr_id': '6600000100000', 'house_fias_id': 'c2341fbb-23c3-40ec-a946-a4e67a9f13a2', 'area_type_full': null, 'area_with_type': null, 'capital_marker': '2', 'city_type_full': 'город', 'city_with_type': 'г Екатеринбург', 'flat_type_full': null, 'history_values': null, 'house_kladr_id': '6600000100012950036', 'region_fias_id': '92b30014-4d52-4e2e-892d-928142b924bf', 'street_fias_id': '726bf295-4b49-422a-89ac-f8f16f454a3d', 'unparsed_parts': null, 'block_type_full': null, 'house_type_full': 'дом', 'region_iso_code': 'RU-SVE', 'region_kladr_id': '6600000000000', 'settlement_type': null, 'street_kladr_id': '66000001000129500', 'beltway_distance': null, 'country_iso_code': 'RU', 'federal_district': null, 'region_type_full': 'область', 'region_with_type': 'Свердловская обл', 'street_type_full': 'улица', 'street_with_type': 'ул Щорса', 'tax_office_legal': '6679', 'city_district_type': null, 'settlement_fias_id': null, 'square_meter_price': null, 'settlement_kladr_id': null, 'fias_actuality_state': '0', 'settlement_type_full': null, 'settlement_with_type': null, 'city_district_fias_id': null, 'city_district_kladr_id': null, 'city_district_type_full': null, 'city_district_with_type': null }, 'value': 'г Екатеринбург, ул Щорса, д 103', 'address': 'г Екатеринбург, ул Щорса, д 103', 'unrestricted_value': '620144, Свердловская обл, г Екатеринбург, ул Щорса, д 103' },
    address: 'г Екатеринбург, ул Щорса, д 103',
    map: { 'dv': 1, 'type': 'building', 'sections': [{ 'id': '108', 'name': '1', 'type': 'section', 'index': 1, 'floors': [{ 'id': '213', 'name': '16', 'type': 'floor', 'index': 16, 'units': [{ 'id': '207', 'type': 'unit', 'label': '85' }, { 'id': '208', 'type': 'unit', 'label': '86' }, { 'id': '209', 'type': 'unit', 'label': '87' }, { 'id': '210', 'type': 'unit', 'label': '88' }, { 'id': '211', 'type': 'unit', 'label': '89' }, { 'id': '212', 'type': 'unit', 'label': '90' }] }, { 'id': '206', 'name': '15', 'type': 'floor', 'index': 15, 'units': [{ 'id': '200', 'type': 'unit', 'label': '79' }, { 'id': '201', 'type': 'unit', 'label': '80' }, { 'id': '202', 'type': 'unit', 'label': '81' }, { 'id': '203', 'type': 'unit', 'label': '82' }, { 'id': '204', 'type': 'unit', 'label': '83' }, { 'id': '205', 'type': 'unit', 'label': '84' }] }, { 'id': '199', 'name': '14', 'type': 'floor', 'index': 14, 'units': [{ 'id': '193', 'type': 'unit', 'label': '73' }, { 'id': '194', 'type': 'unit', 'label': '74' }, { 'id': '195', 'type': 'unit', 'label': '75' }, { 'id': '196', 'type': 'unit', 'label': '76' }, { 'id': '197', 'type': 'unit', 'label': '77' }, { 'id': '198', 'type': 'unit', 'label': '78' }] }, { 'id': '192', 'name': '13', 'type': 'floor', 'index': 13, 'units': [{ 'id': '186', 'type': 'unit', 'label': '67' }, { 'id': '187', 'type': 'unit', 'label': '68' }, { 'id': '188', 'type': 'unit', 'label': '69' }, { 'id': '189', 'type': 'unit', 'label': '70' }, { 'id': '190', 'type': 'unit', 'label': '71' }, { 'id': '191', 'type': 'unit', 'label': '72' }] }, { 'id': '185', 'name': '12', 'type': 'floor', 'index': 12, 'units': [{ 'id': '179', 'type': 'unit', 'label': '61' }, { 'id': '180', 'type': 'unit', 'label': '62' }, { 'id': '181', 'type': 'unit', 'label': '63' }, { 'id': '182', 'type': 'unit', 'label': '64' }, { 'id': '183', 'type': 'unit', 'label': '65' }, { 'id': '184', 'type': 'unit', 'label': '66' }] }, { 'id': '178', 'name': '11', 'type': 'floor', 'index': 11, 'units': [{ 'id': '172', 'type': 'unit', 'label': '55' }, { 'id': '173', 'type': 'unit', 'label': '56' }, { 'id': '174', 'type': 'unit', 'label': '57' }, { 'id': '175', 'type': 'unit', 'label': '58' }, { 'id': '176', 'type': 'unit', 'label': '59' }, { 'id': '177', 'type': 'unit', 'label': '60' }] }, { 'id': '171', 'name': '10', 'type': 'floor', 'index': 10, 'units': [{ 'id': '165', 'type': 'unit', 'label': '49' }, { 'id': '166', 'type': 'unit', 'label': '50' }, { 'id': '167', 'type': 'unit', 'label': '51' }, { 'id': '168', 'type': 'unit', 'label': '52' }, { 'id': '169', 'type': 'unit', 'label': '53' }, { 'id': '170', 'type': 'unit', 'label': '54' }] }, { 'id': '164', 'name': '9', 'type': 'floor', 'index': 9, 'units': [{ 'id': '158', 'type': 'unit', 'label': '43' }, { 'id': '159', 'type': 'unit', 'label': '44' }, { 'id': '160', 'type': 'unit', 'label': '45' }, { 'id': '161', 'type': 'unit', 'label': '46' }, { 'id': '162', 'type': 'unit', 'label': '47' }, { 'id': '163', 'type': 'unit', 'label': '48' }] }, { 'id': '157', 'name': '8', 'type': 'floor', 'index': 8, 'units': [{ 'id': '151', 'type': 'unit', 'label': '37' }, { 'id': '152', 'type': 'unit', 'label': '38' }, { 'id': '153', 'type': 'unit', 'label': '39' }, { 'id': '154', 'type': 'unit', 'label': '40' }, { 'id': '155', 'type': 'unit', 'label': '41' }, { 'id': '156', 'type': 'unit', 'label': '42' }] }, { 'id': '150', 'name': '7', 'type': 'floor', 'index': 7, 'units': [{ 'id': '144', 'type': 'unit', 'label': '31' }, { 'id': '145', 'type': 'unit', 'label': '32' }, { 'id': '146', 'type': 'unit', 'label': '33' }, { 'id': '147', 'type': 'unit', 'label': '34' }, { 'id': '148', 'type': 'unit', 'label': '35' }, { 'id': '149', 'type': 'unit', 'label': '36' }] }, { 'id': '143', 'name': '6', 'type': 'floor', 'index': 6, 'units': [{ 'id': '137', 'type': 'unit', 'label': '25' }, { 'id': '138', 'type': 'unit', 'label': '26' }, { 'id': '139', 'type': 'unit', 'label': '27' }, { 'id': '140', 'type': 'unit', 'label': '28' }, { 'id': '141', 'type': 'unit', 'label': '29' }, { 'id': '142', 'type': 'unit', 'label': '30' }] }, { 'id': '136', 'name': '5', 'type': 'floor', 'index': 5, 'units': [{ 'id': '130', 'type': 'unit', 'label': '19' }, { 'id': '131', 'type': 'unit', 'label': '20' }, { 'id': '132', 'type': 'unit', 'label': '21' }, { 'id': '133', 'type': 'unit', 'label': '22' }, { 'id': '134', 'type': 'unit', 'label': '23' }, { 'id': '135', 'type': 'unit', 'label': '24' }] }, { 'id': '129', 'name': '4', 'type': 'floor', 'index': 4, 'units': [{ 'id': '123', 'type': 'unit', 'label': '13' }, { 'id': '124', 'type': 'unit', 'label': '14' }, { 'id': '125', 'type': 'unit', 'label': '15' }, { 'id': '126', 'type': 'unit', 'label': '16' }, { 'id': '127', 'type': 'unit', 'label': '17' }, { 'id': '128', 'type': 'unit', 'label': '18' }] }, { 'id': '122', 'name': '3', 'type': 'floor', 'index': 3, 'units': [{ 'id': '116', 'type': 'unit', 'label': '7' }, { 'id': '117', 'type': 'unit', 'label': '8' }, { 'id': '118', 'type': 'unit', 'label': '9' }, { 'id': '119', 'type': 'unit', 'label': '10' }, { 'id': '120', 'type': 'unit', 'label': '11' }, { 'id': '121', 'type': 'unit', 'label': '12' }] }, { 'id': '115', 'name': '2', 'type': 'floor', 'index': 2, 'units': [{ 'id': '109', 'type': 'unit', 'label': '1' }, { 'id': '110', 'type': 'unit', 'label': '2' }, { 'id': '111', 'type': 'unit', 'label': '3' }, { 'id': '112', 'type': 'unit', 'label': '4' }, { 'id': '113', 'type': 'unit', 'label': '5' }, { 'id': '114', 'type': 'unit', 'label': '6' }] }] }, { 'id': '334', 'name': '2', 'type': 'section', 'index': 2, 'floors': [{ 'id': '453', 'name': '18', 'type': 'floor', 'index': 18, 'units': [{ 'id': '447', 'type': 'unit', 'label': '187' }, { 'id': '448', 'type': 'unit', 'label': '188' }, { 'id': '449', 'type': 'unit', 'label': '189' }, { 'id': '450', 'type': 'unit', 'label': '190' }, { 'id': '451', 'type': 'unit', 'label': '191' }, { 'id': '452', 'type': 'unit', 'label': '192' }] }, { 'id': '446', 'name': '17', 'type': 'floor', 'index': 17, 'units': [{ 'id': '440', 'type': 'unit', 'label': '181' }, { 'id': '441', 'type': 'unit', 'label': '182' }, { 'id': '442', 'type': 'unit', 'label': '183' }, { 'id': '443', 'type': 'unit', 'label': '184' }, { 'id': '444', 'type': 'unit', 'label': '185' }, { 'id': '445', 'type': 'unit', 'label': '186' }] }, { 'id': '439', 'name': '16', 'type': 'floor', 'index': 16, 'units': [{ 'id': '433', 'type': 'unit', 'label': '175' }, { 'id': '434', 'type': 'unit', 'label': '176' }, { 'id': '435', 'type': 'unit', 'label': '177' }, { 'id': '436', 'type': 'unit', 'label': '178' }, { 'id': '437', 'type': 'unit', 'label': '179' }, { 'id': '438', 'type': 'unit', 'label': '180' }] }, { 'id': '432', 'name': '15', 'type': 'floor', 'index': 15, 'units': [{ 'id': '426', 'type': 'unit', 'label': '169' }, { 'id': '427', 'type': 'unit', 'label': '170' }, { 'id': '428', 'type': 'unit', 'label': '171' }, { 'id': '429', 'type': 'unit', 'label': '172' }, { 'id': '430', 'type': 'unit', 'label': '173' }, { 'id': '431', 'type': 'unit', 'label': '174' }] }, { 'id': '425', 'name': '14', 'type': 'floor', 'index': 14, 'units': [{ 'id': '419', 'type': 'unit', 'label': '163' }, { 'id': '420', 'type': 'unit', 'label': '164' }, { 'id': '421', 'type': 'unit', 'label': '165' }, { 'id': '422', 'type': 'unit', 'label': '166' }, { 'id': '423', 'type': 'unit', 'label': '167' }, { 'id': '424', 'type': 'unit', 'label': '168' }] }, { 'id': '418', 'name': '13', 'type': 'floor', 'index': 13, 'units': [{ 'id': '412', 'type': 'unit', 'label': '157' }, { 'id': '413', 'type': 'unit', 'label': '158' }, { 'id': '414', 'type': 'unit', 'label': '159' }, { 'id': '415', 'type': 'unit', 'label': '160' }, { 'id': '416', 'type': 'unit', 'label': '161' }, { 'id': '417', 'type': 'unit', 'label': '162' }] }, { 'id': '411', 'name': '12', 'type': 'floor', 'index': 12, 'units': [{ 'id': '405', 'type': 'unit', 'label': '151' }, { 'id': '406', 'type': 'unit', 'label': '152' }, { 'id': '407', 'type': 'unit', 'label': '153' }, { 'id': '408', 'type': 'unit', 'label': '154' }, { 'id': '409', 'type': 'unit', 'label': '155' }, { 'id': '410', 'type': 'unit', 'label': '156' }] }, { 'id': '404', 'name': '11', 'type': 'floor', 'index': 11, 'units': [{ 'id': '398', 'type': 'unit', 'label': '145' }, { 'id': '399', 'type': 'unit', 'label': '146' }, { 'id': '400', 'type': 'unit', 'label': '147' }, { 'id': '401', 'type': 'unit', 'label': '148' }, { 'id': '402', 'type': 'unit', 'label': '149' }, { 'id': '403', 'type': 'unit', 'label': '150' }] }, { 'id': '397', 'name': '10', 'type': 'floor', 'index': 10, 'units': [{ 'id': '391', 'type': 'unit', 'label': '139' }, { 'id': '392', 'type': 'unit', 'label': '140' }, { 'id': '393', 'type': 'unit', 'label': '141' }, { 'id': '394', 'type': 'unit', 'label': '142' }, { 'id': '395', 'type': 'unit', 'label': '143' }, { 'id': '396', 'type': 'unit', 'label': '144' }] }, { 'id': '390', 'name': '9', 'type': 'floor', 'index': 9, 'units': [{ 'id': '384', 'type': 'unit', 'label': '133' }, { 'id': '385', 'type': 'unit', 'label': '134' }, { 'id': '386', 'type': 'unit', 'label': '135' }, { 'id': '387', 'type': 'unit', 'label': '136' }, { 'id': '388', 'type': 'unit', 'label': '137' }, { 'id': '389', 'type': 'unit', 'label': '138' }] }, { 'id': '383', 'name': '8', 'type': 'floor', 'index': 8, 'units': [{ 'id': '377', 'type': 'unit', 'label': '127' }, { 'id': '378', 'type': 'unit', 'label': '128' }, { 'id': '379', 'type': 'unit', 'label': '129' }, { 'id': '380', 'type': 'unit', 'label': '130' }, { 'id': '381', 'type': 'unit', 'label': '131' }, { 'id': '382', 'type': 'unit', 'label': '132' }] }, { 'id': '376', 'name': '7', 'type': 'floor', 'index': 7, 'units': [{ 'id': '370', 'type': 'unit', 'label': '121' }, { 'id': '371', 'type': 'unit', 'label': '122' }, { 'id': '372', 'type': 'unit', 'label': '123' }, { 'id': '373', 'type': 'unit', 'label': '124' }, { 'id': '374', 'type': 'unit', 'label': '125' }, { 'id': '375', 'type': 'unit', 'label': '126' }] }, { 'id': '369', 'name': '6', 'type': 'floor', 'index': 6, 'units': [{ 'id': '363', 'type': 'unit', 'label': '115' }, { 'id': '364', 'type': 'unit', 'label': '116' }, { 'id': '365', 'type': 'unit', 'label': '117' }, { 'id': '366', 'type': 'unit', 'label': '118' }, { 'id': '367', 'type': 'unit', 'label': '119' }, { 'id': '368', 'type': 'unit', 'label': '120' }] }, { 'id': '362', 'name': '5', 'type': 'floor', 'index': 5, 'units': [{ 'id': '356', 'type': 'unit', 'label': '109' }, { 'id': '357', 'type': 'unit', 'label': '110' }, { 'id': '358', 'type': 'unit', 'label': '111' }, { 'id': '359', 'type': 'unit', 'label': '112' }, { 'id': '360', 'type': 'unit', 'label': '113' }, { 'id': '361', 'type': 'unit', 'label': '114' }] }, { 'id': '355', 'name': '4', 'type': 'floor', 'index': 4, 'units': [{ 'id': '349', 'type': 'unit', 'label': '103' }, { 'id': '350', 'type': 'unit', 'label': '104' }, { 'id': '351', 'type': 'unit', 'label': '105' }, { 'id': '352', 'type': 'unit', 'label': '106' }, { 'id': '353', 'type': 'unit', 'label': '107' }, { 'id': '354', 'type': 'unit', 'label': '108' }] }, { 'id': '348', 'name': '3', 'type': 'floor', 'index': 3, 'units': [{ 'id': '342', 'type': 'unit', 'label': '97' }, { 'id': '343', 'type': 'unit', 'label': '98' }, { 'id': '344', 'type': 'unit', 'label': '99' }, { 'id': '345', 'type': 'unit', 'label': '100' }, { 'id': '346', 'type': 'unit', 'label': '101' }, { 'id': '347', 'type': 'unit', 'label': '102' }] }, { 'id': '341', 'name': '2', 'type': 'floor', 'index': 2, 'units': [{ 'id': '335', 'type': 'unit', 'label': '91' }, { 'id': '336', 'type': 'unit', 'label': '92' }, { 'id': '337', 'type': 'unit', 'label': '93' }, { 'id': '338', 'type': 'unit', 'label': '94' }, { 'id': '339', 'type': 'unit', 'label': '95' }, { 'id': '340', 'type': 'unit', 'label': '96' }] }] }, { 'id': '574', 'name': '3', 'type': 'section', 'index': 3, 'floors': [{ 'id': '693', 'name': '18', 'type': 'floor', 'index': 18, 'units': [{ 'id': '687', 'type': 'unit', 'label': '289' }, { 'id': '688', 'type': 'unit', 'label': '290' }, { 'id': '689', 'type': 'unit', 'label': '291' }, { 'id': '690', 'type': 'unit', 'label': '292' }, { 'id': '691', 'type': 'unit', 'label': '293' }, { 'id': '692', 'type': 'unit', 'label': '294' }] }, { 'id': '686', 'name': '17', 'type': 'floor', 'index': 17, 'units': [{ 'id': '680', 'type': 'unit', 'label': '283' }, { 'id': '681', 'type': 'unit', 'label': '284' }, { 'id': '682', 'type': 'unit', 'label': '285' }, { 'id': '683', 'type': 'unit', 'label': '286' }, { 'id': '684', 'type': 'unit', 'label': '287' }, { 'id': '685', 'type': 'unit', 'label': '288' }] }, { 'id': '679', 'name': '16', 'type': 'floor', 'index': 16, 'units': [{ 'id': '673', 'type': 'unit', 'label': '277' }, { 'id': '674', 'type': 'unit', 'label': '278' }, { 'id': '675', 'type': 'unit', 'label': '279' }, { 'id': '676', 'type': 'unit', 'label': '280' }, { 'id': '677', 'type': 'unit', 'label': '281' }, { 'id': '678', 'type': 'unit', 'label': '282' }] }, { 'id': '672', 'name': '15', 'type': 'floor', 'index': 15, 'units': [{ 'id': '666', 'type': 'unit', 'label': '271' }, { 'id': '667', 'type': 'unit', 'label': '272' }, { 'id': '668', 'type': 'unit', 'label': '273' }, { 'id': '669', 'type': 'unit', 'label': '274' }, { 'id': '670', 'type': 'unit', 'label': '275' }, { 'id': '671', 'type': 'unit', 'label': '276' }] }, { 'id': '665', 'name': '14', 'type': 'floor', 'index': 14, 'units': [{ 'id': '659', 'type': 'unit', 'label': '265' }, { 'id': '660', 'type': 'unit', 'label': '266' }, { 'id': '661', 'type': 'unit', 'label': '267' }, { 'id': '662', 'type': 'unit', 'label': '268' }, { 'id': '663', 'type': 'unit', 'label': '269' }, { 'id': '664', 'type': 'unit', 'label': '270' }] }, { 'id': '658', 'name': '13', 'type': 'floor', 'index': 13, 'units': [{ 'id': '652', 'type': 'unit', 'label': '259' }, { 'id': '653', 'type': 'unit', 'label': '260' }, { 'id': '654', 'type': 'unit', 'label': '261' }, { 'id': '655', 'type': 'unit', 'label': '262' }, { 'id': '656', 'type': 'unit', 'label': '263' }, { 'id': '657', 'type': 'unit', 'label': '264' }] }, { 'id': '651', 'name': '12', 'type': 'floor', 'index': 12, 'units': [{ 'id': '645', 'type': 'unit', 'label': '253' }, { 'id': '646', 'type': 'unit', 'label': '254' }, { 'id': '647', 'type': 'unit', 'label': '255' }, { 'id': '648', 'type': 'unit', 'label': '256' }, { 'id': '649', 'type': 'unit', 'label': '257' }, { 'id': '650', 'type': 'unit', 'label': '258' }] }, { 'id': '644', 'name': '11', 'type': 'floor', 'index': 11, 'units': [{ 'id': '638', 'type': 'unit', 'label': '247' }, { 'id': '639', 'type': 'unit', 'label': '248' }, { 'id': '640', 'type': 'unit', 'label': '249' }, { 'id': '641', 'type': 'unit', 'label': '250' }, { 'id': '642', 'type': 'unit', 'label': '251' }, { 'id': '643', 'type': 'unit', 'label': '252' }] }, { 'id': '637', 'name': '10', 'type': 'floor', 'index': 10, 'units': [{ 'id': '631', 'type': 'unit', 'label': '241' }, { 'id': '632', 'type': 'unit', 'label': '242' }, { 'id': '633', 'type': 'unit', 'label': '243' }, { 'id': '634', 'type': 'unit', 'label': '244' }, { 'id': '635', 'type': 'unit', 'label': '245' }, { 'id': '636', 'type': 'unit', 'label': '246' }] }, { 'id': '630', 'name': '9', 'type': 'floor', 'index': 9, 'units': [{ 'id': '624', 'type': 'unit', 'label': '235' }, { 'id': '625', 'type': 'unit', 'label': '236' }, { 'id': '626', 'type': 'unit', 'label': '237' }, { 'id': '627', 'type': 'unit', 'label': '238' }, { 'id': '628', 'type': 'unit', 'label': '239' }, { 'id': '629', 'type': 'unit', 'label': '240' }] }, { 'id': '623', 'name': '8', 'type': 'floor', 'index': 8, 'units': [{ 'id': '617', 'type': 'unit', 'label': '229' }, { 'id': '618', 'type': 'unit', 'label': '230' }, { 'id': '619', 'type': 'unit', 'label': '231' }, { 'id': '620', 'type': 'unit', 'label': '232' }, { 'id': '621', 'type': 'unit', 'label': '233' }, { 'id': '622', 'type': 'unit', 'label': '234' }] }, { 'id': '616', 'name': '7', 'type': 'floor', 'index': 7, 'units': [{ 'id': '610', 'type': 'unit', 'label': '223' }, { 'id': '611', 'type': 'unit', 'label': '224' }, { 'id': '612', 'type': 'unit', 'label': '225' }, { 'id': '613', 'type': 'unit', 'label': '226' }, { 'id': '614', 'type': 'unit', 'label': '227' }, { 'id': '615', 'type': 'unit', 'label': '228' }] }, { 'id': '609', 'name': '6', 'type': 'floor', 'index': 6, 'units': [{ 'id': '603', 'type': 'unit', 'label': '217' }, { 'id': '604', 'type': 'unit', 'label': '218' }, { 'id': '605', 'type': 'unit', 'label': '219' }, { 'id': '606', 'type': 'unit', 'label': '220' }, { 'id': '607', 'type': 'unit', 'label': '221' }, { 'id': '608', 'type': 'unit', 'label': '222' }] }, { 'id': '602', 'name': '5', 'type': 'floor', 'index': 5, 'units': [{ 'id': '596', 'type': 'unit', 'label': '211' }, { 'id': '597', 'type': 'unit', 'label': '212' }, { 'id': '598', 'type': 'unit', 'label': '213' }, { 'id': '599', 'type': 'unit', 'label': '214' }, { 'id': '600', 'type': 'unit', 'label': '215' }, { 'id': '601', 'type': 'unit', 'label': '216' }] }, { 'id': '595', 'name': '4', 'type': 'floor', 'index': 4, 'units': [{ 'id': '589', 'type': 'unit', 'label': '205' }, { 'id': '590', 'type': 'unit', 'label': '206' }, { 'id': '591', 'type': 'unit', 'label': '207' }, { 'id': '592', 'type': 'unit', 'label': '208' }, { 'id': '593', 'type': 'unit', 'label': '209' }, { 'id': '594', 'type': 'unit', 'label': '210' }] }, { 'id': '588', 'name': '3', 'type': 'floor', 'index': 3, 'units': [{ 'id': '582', 'type': 'unit', 'label': '199' }, { 'id': '583', 'type': 'unit', 'label': '200' }, { 'id': '584', 'type': 'unit', 'label': '201' }, { 'id': '585', 'type': 'unit', 'label': '202' }, { 'id': '586', 'type': 'unit', 'label': '203' }, { 'id': '587', 'type': 'unit', 'label': '204' }] }, { 'id': '581', 'name': '2', 'type': 'floor', 'index': 2, 'units': [{ 'id': '575', 'type': 'unit', 'label': '193' }, { 'id': '576', 'type': 'unit', 'label': '194' }, { 'id': '577', 'type': 'unit', 'label': '195' }, { 'id': '578', 'type': 'unit', 'label': '196' }, { 'id': '579', 'type': 'unit', 'label': '197' }, { 'id': '580', 'type': 'unit', 'label': '198' }] }] }, { 'id': '800', 'name': '4', 'type': 'section', 'index': 4, 'floors': [{ 'id': '905', 'name': '16', 'type': 'floor', 'index': 16, 'units': [{ 'id': '899', 'type': 'unit', 'label': '379' }, { 'id': '900', 'type': 'unit', 'label': '380' }, { 'id': '901', 'type': 'unit', 'label': '381' }, { 'id': '902', 'type': 'unit', 'label': '382' }, { 'id': '903', 'type': 'unit', 'label': '383' }, { 'id': '904', 'type': 'unit', 'label': '384' }] }, { 'id': '898', 'name': '15', 'type': 'floor', 'index': 15, 'units': [{ 'id': '892', 'type': 'unit', 'label': '373' }, { 'id': '893', 'type': 'unit', 'label': '374' }, { 'id': '894', 'type': 'unit', 'label': '375' }, { 'id': '895', 'type': 'unit', 'label': '376' }, { 'id': '896', 'type': 'unit', 'label': '377' }, { 'id': '897', 'type': 'unit', 'label': '378' }] }, { 'id': '891', 'name': '14', 'type': 'floor', 'index': 14, 'units': [{ 'id': '885', 'type': 'unit', 'label': '367' }, { 'id': '886', 'type': 'unit', 'label': '368' }, { 'id': '887', 'type': 'unit', 'label': '369' }, { 'id': '888', 'type': 'unit', 'label': '370' }, { 'id': '889', 'type': 'unit', 'label': '371' }, { 'id': '890', 'type': 'unit', 'label': '372' }] }, { 'id': '884', 'name': '13', 'type': 'floor', 'index': 13, 'units': [{ 'id': '878', 'type': 'unit', 'label': '361' }, { 'id': '879', 'type': 'unit', 'label': '362' }, { 'id': '880', 'type': 'unit', 'label': '363' }, { 'id': '881', 'type': 'unit', 'label': '364' }, { 'id': '882', 'type': 'unit', 'label': '365' }, { 'id': '883', 'type': 'unit', 'label': '366' }] }, { 'id': '877', 'name': '12', 'type': 'floor', 'index': 12, 'units': [{ 'id': '871', 'type': 'unit', 'label': '355' }, { 'id': '872', 'type': 'unit', 'label': '356' }, { 'id': '873', 'type': 'unit', 'label': '357' }, { 'id': '874', 'type': 'unit', 'label': '358' }, { 'id': '875', 'type': 'unit', 'label': '359' }, { 'id': '876', 'type': 'unit', 'label': '360' }] }, { 'id': '870', 'name': '11', 'type': 'floor', 'index': 11, 'units': [{ 'id': '864', 'type': 'unit', 'label': '349' }, { 'id': '865', 'type': 'unit', 'label': '350' }, { 'id': '866', 'type': 'unit', 'label': '351' }, { 'id': '867', 'type': 'unit', 'label': '352' }, { 'id': '868', 'type': 'unit', 'label': '353' }, { 'id': '869', 'type': 'unit', 'label': '354' }] }, { 'id': '863', 'name': '10', 'type': 'floor', 'index': 10, 'units': [{ 'id': '857', 'type': 'unit', 'label': '343' }, { 'id': '858', 'type': 'unit', 'label': '344' }, { 'id': '859', 'type': 'unit', 'label': '345' }, { 'id': '860', 'type': 'unit', 'label': '346' }, { 'id': '861', 'type': 'unit', 'label': '347' }, { 'id': '862', 'type': 'unit', 'label': '348' }] }, { 'id': '856', 'name': '9', 'type': 'floor', 'index': 9, 'units': [{ 'id': '850', 'type': 'unit', 'label': '337' }, { 'id': '851', 'type': 'unit', 'label': '338' }, { 'id': '852', 'type': 'unit', 'label': '339' }, { 'id': '853', 'type': 'unit', 'label': '340' }, { 'id': '854', 'type': 'unit', 'label': '341' }, { 'id': '855', 'type': 'unit', 'label': '342' }] }, { 'id': '849', 'name': '8', 'type': 'floor', 'index': 8, 'units': [{ 'id': '843', 'type': 'unit', 'label': '331' }, { 'id': '844', 'type': 'unit', 'label': '332' }, { 'id': '845', 'type': 'unit', 'label': '333' }, { 'id': '846', 'type': 'unit', 'label': '334' }, { 'id': '847', 'type': 'unit', 'label': '335' }, { 'id': '848', 'type': 'unit', 'label': '336' }] }, { 'id': '842', 'name': '7', 'type': 'floor', 'index': 7, 'units': [{ 'id': '836', 'type': 'unit', 'label': '325' }, { 'id': '837', 'type': 'unit', 'label': '326' }, { 'id': '838', 'type': 'unit', 'label': '327' }, { 'id': '839', 'type': 'unit', 'label': '328' }, { 'id': '840', 'type': 'unit', 'label': '329' }, { 'id': '841', 'type': 'unit', 'label': '330' }] }, { 'id': '835', 'name': '6', 'type': 'floor', 'index': 6, 'units': [{ 'id': '829', 'type': 'unit', 'label': '319' }, { 'id': '830', 'type': 'unit', 'label': '320' }, { 'id': '831', 'type': 'unit', 'label': '321' }, { 'id': '832', 'type': 'unit', 'label': '322' }, { 'id': '833', 'type': 'unit', 'label': '323' }, { 'id': '834', 'type': 'unit', 'label': '324' }] }, { 'id': '828', 'name': '5', 'type': 'floor', 'index': 5, 'units': [{ 'id': '822', 'type': 'unit', 'label': '313' }, { 'id': '823', 'type': 'unit', 'label': '314' }, { 'id': '824', 'type': 'unit', 'label': '315' }, { 'id': '825', 'type': 'unit', 'label': '316' }, { 'id': '826', 'type': 'unit', 'label': '317' }, { 'id': '827', 'type': 'unit', 'label': '318' }] }, { 'id': '821', 'name': '4', 'type': 'floor', 'index': 4, 'units': [{ 'id': '815', 'type': 'unit', 'label': '307' }, { 'id': '816', 'type': 'unit', 'label': '308' }, { 'id': '817', 'type': 'unit', 'label': '309' }, { 'id': '818', 'type': 'unit', 'label': '310' }, { 'id': '819', 'type': 'unit', 'label': '311' }, { 'id': '820', 'type': 'unit', 'label': '312' }] }, { 'id': '814', 'name': '3', 'type': 'floor', 'index': 3, 'units': [{ 'id': '808', 'type': 'unit', 'label': '301' }, { 'id': '809', 'type': 'unit', 'label': '302' }, { 'id': '810', 'type': 'unit', 'label': '303' }, { 'id': '811', 'type': 'unit', 'label': '304' }, { 'id': '812', 'type': 'unit', 'label': '305' }, { 'id': '813', 'type': 'unit', 'label': '306' }] }, { 'id': '807', 'name': '2', 'type': 'floor', 'index': 2, 'units': [{ 'id': '801', 'type': 'unit', 'label': '295' }, { 'id': '802', 'type': 'unit', 'label': '296' }, { 'id': '803', 'type': 'unit', 'label': '297' }, { 'id': '804', 'type': 'unit', 'label': '298' }, { 'id': '805', 'type': 'unit', 'label': '299' }, { 'id': '806', 'type': 'unit', 'label': '300' }] }] }] },
}

export {
    buildingEmptyMapJson,
    buildingMapJson,
    buildingAddressMetaJson,
    notValidBuildingMapJson,
    validHouseTypes,
    demoProperty,
}
