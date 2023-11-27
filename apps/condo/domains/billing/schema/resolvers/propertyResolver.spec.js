const { AddressTransform, PropertyResolver, PropertyFinder } = require('./propertyResolver')

const rules = Object.fromEntries([
    ['ул.Революции 1905 года', 'г. Новороссийск, ул.Революции 1905 года'],
    ['r^(.*?)\\sК.$', 'Самара, $1'],
    ['r^Автопарковка (.*?)№(.*?)$', '$1 м/м $2'],
])

const TRANSFORM_CASES = [
    {
        input: 'ул.Революции 1905 года, д.37, кв.1001',
        output: 'г. Новороссийск, ул.Революции 1905 года, д.37, кв.1001',
    },
    {
        input: 'Автопарковка Юннатов пер, дом 44А, № 2003',
        output: 'Юннатов пер, дом 44А, м/м 2003',
    },
    {
        input: '   Автопарковка Юннатов пер, дом 44А, №2003',
        output: 'Юннатов пер, дом 44А, м/м 2003',
    },
    {
        input: '   Автопарковка Юннатов пер, дом 44А, №  2003',
        output: 'Юннатов пер, дом 44А, м/м 2003',
    },
    {
        input: 'УЛ СЪЕЗДОВСКАЯ Д. 110 КВ. 1410 К.',
        output: 'Самара, УЛ СЪЕЗДОВСКАЯ Д. 110 КВ. 1410',
    },
    {
        input: 'УЛ СЪЕЗДОВСКАЯ Д. 110 КВ. 1410 К.           ',
        output: 'Самара, УЛ СЪЕЗДОВСКАЯ Д. 110 КВ. 1410',
    },
    {
        input: 'УЛ СЪЕЗДОВСКАЯ Д. 110 КВ. 1410 К.           ',
        output: 'Самара, УЛ СЪЕЗДОВСКАЯ Д. 110 КВ. 1410',
    },
]


describe('Transform address according to context rules', () => {
    const transform = new AddressTransform()
    transform.init(rules)
    for (const rawData of TRANSFORM_CASES) {
        const { input, output } = rawData
        test(`"${input}" to be: "${output}" `, () => {
            const result = transform.apply(input)
            expect(result).toEqual(output)
        })
    }
    test('case of Cottage Village', () => {
        const transform = new AddressTransform()
        transform.init({ 'r^(.*?)$': '$1, кв. 1' })
        const result = transform.apply('Some village house')
        expect(result).toEqual('Some village house, кв. 1')
    })
    test('case of Cottage Village with unit', () => {
        const transform = new AddressTransform()
        transform.init({ 'r,\\s-$': ', кв. 1' })
        const result = transform.apply('п.Малое Васильково, ул.Вишнёвая, уч.10, -')
        expect(result).toEqual('п.Малое Васильково, ул.Вишнёвая, уч.10, кв. 1')
    })
})

const PARSE_ADDRESS_CASES_PRIORITIES = [
    // When address is the only source of information
    { description: 'address for the unit', receipt: { address: 'пер.Малый Козихинский, д.7, м/м 3,4 (1 ур.)' }, result: { addresses: ['пер.Малый Козихинский, д.7'], unitName: '3,4 (1 ур.)', unitType: 'parking' } },
    { description: 'address for a single house', receipt: { address: 'пер.Малый Козихинский, д.7' }, addressTransform: { 'r^(.*?)$': '$1, кв. 1' }, result: { addresses: ['пер.Малый Козихинский, д.7'], unitName: '1', unitType: 'flat' } },
    { description: 'unitType is not in our type', receipt: { address: 'пер.Малый Козихинский, д.7', addressMeta: { unitName: '3,4 (1 ур.)', unitType: 'машиноместо' } }, result: { addresses: ['пер.Малый Козихинский, д.7'], unitName: '3,4 (1 ур.)', unitType: 'parking' } },
    { description: 'unitType is in our type', receipt: { address: 'пер.Малый Козихинский, д.7', addressMeta: { unitName: '3,4 (1 ур.)', unitType: 'warehouse' }  }, result: { addresses: ['пер.Малый Козихинский, д.7'], unitName: '3,4 (1 ур.)', unitType: 'warehouse' } },
    { description: 'Fias instead of address string', receipt: { address: 'b746e6bd-e02b-4987-bb1c-bb9dd808f909' }, result: { addresses: ['fiasId:b746e6bd-e02b-4987-bb1c-bb9dd808f909'], unitName: '', unitType: '' } },
    { description: 'Fias with unitName and unitType instead of address string', receipt: { address: 'b746e6bd-e02b-4987-bb1c-bb9dd808f909,кладовая 1' }, result: { addresses: ['fiasId:b746e6bd-e02b-4987-bb1c-bb9dd808f909'], unitName: '1', unitType: 'warehouse' } },
    { description: 'Fias without unitType instead of address', receipt: { address: 'b746e6bd-e02b-4987-bb1c-bb9dd808f909,1' }, result: { addresses: ['fiasId:b746e6bd-e02b-4987-bb1c-bb9dd808f909'], unitName: '1', unitType: 'flat' } },
    // When we have additional info from addressMeta as globalId
    { description: 'Additional info about address as a fias without unit', receipt: { address: 'пер.Малый Козихинский, д.7, м/м 3,4 (1 ур.)', addressMeta: { globalId:  'b746e6bd-e02b-4987-bb1c-bb9dd808f909' } }, result: { addresses: ['fiasId:b746e6bd-e02b-4987-bb1c-bb9dd808f909', 'пер.Малый Козихинский, д.7'], unitName: '3,4 (1 ур.)', unitType: 'parking' } },
    { description: 'Additional info about address as a fias with unitName', receipt: { address: 'пер.Малый Козихинский, д.7, м/м 3,4 (1 ур.)', addressMeta: { globalId:  'b746e6bd-e02b-4987-bb1c-bb9dd808f909,3-4[I]' } }, result: { addresses: ['fiasId:b746e6bd-e02b-4987-bb1c-bb9dd808f909', 'пер.Малый Козихинский, д.7'], unitName: '3-4[I]', unitType: 'parking' } },
    { description: 'Additional info about address as a fias with unit', receipt: { address: 'пер.Малый Козихинский, д.7, м/м 3,4 (1 ур.)', addressMeta: { globalId:  'b746e6bd-e02b-4987-bb1c-bb9dd808f909, кладовка 3-4[I]' } }, result: { addresses: ['fiasId:b746e6bd-e02b-4987-bb1c-bb9dd808f909', 'пер.Малый Козихинский, д.7'], unitName: '3-4[I]', unitType: 'warehouse' } },
    { description: 'FIAS should be lower-cased to work with address service', receipt: { address: 'пер.Малый Козихинский, д.7, м/м 3,4 (1 ур.)', addressMeta: { globalId:  'B746E6BD-E02B-4987-BB1C-BB9DD808F909, кладовка 3-4[I]' } }, result: { addresses: ['fiasId:b746e6bd-e02b-4987-bb1c-bb9dd808f909', 'пер.Малый Козихинский, д.7'], unitName: '3-4[I]', unitType: 'warehouse' } },
]

describe('Get information about address from receipt', () => {
    for (const { description, receipt, result, addressTransform } of PARSE_ADDRESS_CASES_PRIORITIES) {
        test(description, () => {
            const resolver = new PropertyResolver({ billingContext: { settings: { addressTransform } } })
            const { addresses, unitName, unitType } = resolver.getAddressFromReceipt(receipt)
            expect(result.unitName).toEqual(unitName)
            expect(result.unitType).toEqual(unitType)
            for (const address of addresses) {
                expect(result.addresses.some(resultAddress => resultAddress === address)).toBeTruthy()
            }
        })
    }
})

const MAIN_ADDRESS_PART = 'Калининградская обл, Гурьевский р-н, поселок Малое Васильково, тер СНТСН Слобода, '

const COTTAGE_VILLAGE_TEST_CASE = {
    organizationProperties: [{ address: MAIN_ADDRESS_PART + 'ул Березовая, д 7' }, { address: MAIN_ADDRESS_PART + 'ул Вишневая, д 29' }, { address: MAIN_ADDRESS_PART + 'ул Березовая, д 6' }, { address: MAIN_ADDRESS_PART + 'ул Березовая, д 11' }, { address: MAIN_ADDRESS_PART + 'ул Березовая, д 9' }, { address: MAIN_ADDRESS_PART + 'ул Сосновая, д 8' }, { address: MAIN_ADDRESS_PART + 'ул Сосновая, д 6' }, { address: MAIN_ADDRESS_PART + 'ул Березовая, д 2б' }, { address: MAIN_ADDRESS_PART + 'ул Сосновая, д 4' }, { address: MAIN_ADDRESS_PART + 'ул Каштановая, д 3' }, { address: MAIN_ADDRESS_PART + 'ул Вишневая, д 3' }, { address: MAIN_ADDRESS_PART + 'ул Вишневая, д 5' }, { address: MAIN_ADDRESS_PART + 'ул Вишневая, д 27' }, { address: MAIN_ADDRESS_PART + 'ул Вишневая, д 4' }, { address: MAIN_ADDRESS_PART + 'ул Вишневая, д 6' }, { address: MAIN_ADDRESS_PART + 'ул Кленовая, д 5' }, { address: MAIN_ADDRESS_PART + 'ул Вишневая, д 25' }, { address: MAIN_ADDRESS_PART + 'ул Вишневая, д 16' }, { address: MAIN_ADDRESS_PART + 'ул Кленовая, д 8' }, { address: MAIN_ADDRESS_PART + 'ул Вишневая, д 23' }, { address: MAIN_ADDRESS_PART + 'ул Березовая, д 3' }, { address: MAIN_ADDRESS_PART + 'ул Сосновая, д 12' }, { address: MAIN_ADDRESS_PART + 'ул Вишневая, д 31' }, { address: MAIN_ADDRESS_PART + 'ул Сосновая, д 5' }, { address: MAIN_ADDRESS_PART + 'ул Сосновая, д 10' }, { address: MAIN_ADDRESS_PART + 'ул Кленовая, д 11' }, { address: MAIN_ADDRESS_PART + 'ул Вишневая, д 2' }, { address: MAIN_ADDRESS_PART + 'ул Кленовая, д 2' }, { address: MAIN_ADDRESS_PART + 'ул Кленовая, д 1' }, { address: MAIN_ADDRESS_PART + 'ул Березовая, д 8' }, { address: MAIN_ADDRESS_PART + 'ул Березовая, д 2А' }, { address: MAIN_ADDRESS_PART + 'ул Вишневая, д 10' }, { address: MAIN_ADDRESS_PART + 'ул Вишневая, д 18' }, { address: MAIN_ADDRESS_PART + 'ул Кленовая, д 10/1' }, { address: MAIN_ADDRESS_PART + 'ул Вишневая, д 17' }, { address: MAIN_ADDRESS_PART + 'ул Березовая, д 1' }, { address: MAIN_ADDRESS_PART + 'ул Сосновая, д 2' }, { address: MAIN_ADDRESS_PART + 'ул Сосновая, д 1' }, { address: MAIN_ADDRESS_PART + 'ул Сосновая, д 3' }, { address: MAIN_ADDRESS_PART + 'ул Березовая, д 10' }, { address: MAIN_ADDRESS_PART + 'ул Кленовая, д 9' }, { address: MAIN_ADDRESS_PART + 'ул Сосновая, д 16' }, { address: MAIN_ADDRESS_PART + 'ул Березовая, д 13' }, { address: MAIN_ADDRESS_PART + 'ул Вишневая, д 20' }, { address: MAIN_ADDRESS_PART + 'ул Вишневая, д 12' }, { address: MAIN_ADDRESS_PART + 'ул Сосновая, д 14' }, { address: MAIN_ADDRESS_PART + 'ул Вишневая, д 21' }, { address: MAIN_ADDRESS_PART + 'ул Вишневая, д 11' }, { address: MAIN_ADDRESS_PART + 'ул Вишневая, д 8' }, { address: MAIN_ADDRESS_PART + 'ул Вишневая, д 7' }, { address: MAIN_ADDRESS_PART + 'ул Вишневая, д 19' }, { address: MAIN_ADDRESS_PART + 'ул Кленовая, д 3' }, { address: MAIN_ADDRESS_PART + 'ул Кленовая, д 7' }, { address: MAIN_ADDRESS_PART + 'ул Кленовая, д 6' }, { address: MAIN_ADDRESS_PART + 'ул Вишневая, д 9' }, { address: MAIN_ADDRESS_PART + 'ул Кленовая, д 15' }, { address: MAIN_ADDRESS_PART + 'ул Вишневая, д 13' }, { address: MAIN_ADDRESS_PART + 'ул Вишневая, д 15' }, { address: MAIN_ADDRESS_PART + 'ул Кленовая, д 13' }, { address: MAIN_ADDRESS_PART + 'ул Березовая, д 5' }, { address: MAIN_ADDRESS_PART + 'ул Кленовая, д 4' }, { address: MAIN_ADDRESS_PART + 'ул Вишневая, д 14' }, { address: MAIN_ADDRESS_PART + 'ул Вишневая, д 1' }, { address: MAIN_ADDRESS_PART + 'ул Березовая, д 4' }, { address: MAIN_ADDRESS_PART + 'ул Кленовая, д 10/2' }, { address: MAIN_ADDRESS_PART + 'ул Вишневая, д 2а' }],
    integrationInputs: [
        {
            'address': 'п.Малое Васильково, ул.Сосновая, уч.4',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Сосновая, д 4',
        }, {
            'address': 'п.Малое Васильково, ул.Сосновая, уч.1',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Сосновая, д 1',
        }, {
            'address': 'п.Малое Васильково, ул.Вишнёвая, уч.10',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Вишневая, д 10',
        }, {
            'address': 'п.Малое Васильково, ул.Берёзовая, уч.3',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Березовая, д 3',
        }, {
            'address': 'п.Малое Васильково, ул.Кленовая, уч.4',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Кленовая, д 4',
        }, {
            'address': 'п.Малое Васильково, ул.Кленовая, уч.11',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Кленовая, д 11',
        }, {
            'address': 'п.Малое Васильково, ул.Кленовая, уч.2',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Кленовая, д 2',
        }, {
            'address': 'п.Малое Васильково, ул.Берёзовая, уч.7',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Березовая, д 7',
        }, {
            'address': 'п.Малое Васильково, ул.Вишнёвая, уч.6',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Вишневая, д 6',
        }, {
            'address': 'п.Малое Васильково, ул.Вишнёвая, уч.13',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Вишневая, д 13',
        }, {
            'address': 'п.Малое Васильково, ул.Вишнёвая, уч.23',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Вишневая, д 23',
        }, {
            'address': 'п.Малое Васильково, ул.Берёзовая, уч.2Б',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Березовая, д 2б',
        }, {
            'address': 'п.Малое Васильково, ул.Вишнёвая, уч.4',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Вишневая, д 4',
        }, {
            'address': 'п.Малое Васильково, ул.Вишнёвая, уч.18',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Вишневая, д 18',
        }, {
            'address': 'п.Малое Васильково, ул.Вишнёвая, уч.25',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Вишневая, д 25',
        }, {
            'address': 'п.Малое Васильково, ул.Берёзовая, уч.4',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Березовая, д 4',
        }, {
            'address': 'п.Малое Васильково, ул.Кленовая, уч.10/2',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Кленовая, д 10/2',
        }, {
            'address': 'п.Малое Васильково, ул.Сосновая, уч.12',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Сосновая, д 12',
        }, {
            'address': 'п.Малое Васильково, ул.Вишнёвая, уч.17',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Вишневая, д 17',
        }, {
            'address': 'п.Малое Васильково, ул.Сосновая, уч.10',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Сосновая, д 10',
        }, {
            'address': 'п.Малое Васильково, ул.Кленовая, уч.9',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Кленовая, д 9',
        }, {
            'address': 'п.Малое Васильково, ул.Вишнёвая, уч.16',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Вишневая, д 16',
        }, {
            'address': 'п.Малое Васильково, ул.Берёзовая, уч.10',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Березовая, д 10',
        }, {
            'address': 'п.Малое Васильково, ул.Вишнёвая, уч.21',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Вишневая, д 21',
        }, {
            'address': 'п.Малое Васильково, ул.Вишнёвая, уч.2А',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Вишневая, д 2а',
        }, {
            'address': 'п.Малое Васильково, ул.Берёзовая, уч.13',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Березовая, д 13',
        }, {
            'address': 'п.Малое Васильково, ул.Вишнёвая, уч.1',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Вишневая, д 1',
        }, {
            'address': 'п.Малое Васильково, ул.Вишнёвая, уч.20',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Вишневая, д 20',
        }, {
            'address': 'п.Малое Васильково, ул.Вишнёвая, уч.29',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Вишневая, д 29',
        }, {
            'address': 'п.Малое Васильково, ул.Вишнёвая, уч.14',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Вишневая, д 14',
        }, {
            'address': 'п.Малое Васильково, ул.Сосновая, уч.3',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Сосновая, д 3',
        }, {
            'address': 'п.Малое Васильково, ул.Вишнёвая, уч.3',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Вишневая, д 3',
        }, {
            'address': 'п.Малое Васильково, ул.Вишнёвая, уч.5',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Вишневая, д 5',
        }, {
            'address': 'п.Малое Васильково, ул.Вишнёвая, уч.27',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Вишневая, д 27',
        }, {
            'address': 'п.Малое Васильково, ул.Вишнёвая, уч.2',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Вишневая, д 2',
        }, {
            'address': 'п.Малое Васильково, ул.Берёзовая, уч.9',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Березовая, д 9',
        }, {
            'address': 'п.Малое Васильково, ул.Вишнёвая, уч.15',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Вишневая, д 15',
        }, {
            'address': 'п.Малое Васильково, ул.Вишнёвая, уч.7',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Вишневая, д 7',
        }, {
            'address': 'п.Малое Васильково, ул.Кленовая, уч.13',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Кленовая, д 13',
        }, {
            'address': 'п.Малое Васильково, ул.Вишнёвая, уч.8',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Вишневая, д 8',
        }, {
            'address': 'п.Малое Васильково, ул.Каштановая, уч.3',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Каштановая, д 3',
        }, {
            'address': 'п.Малое Васильково, ул.Сосновая, уч.5',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Сосновая, д 5',
        }, {
            'address': 'п.Малое Васильково, ул.Вишнёвая, уч.9',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Вишневая, д 9',
        }, {
            'address': 'п.Малое Васильково, ул.Берёзовая, уч.1',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Березовая, д 1',
        }, {
            'address': 'п.Малое Васильково, ул.Кленовая, уч.8',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Кленовая, д 8',
        }, {
            'address': 'п.Малое Васильково, ул.Вишнёвая, уч.19',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Вишневая, д 19',
        }, {
            'address': 'п.Малое Васильково, ул.Вишнёвая, уч.11',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Вишневая, д 11',
        }, {
            'address': 'п.Малое Васильково, ул.Берёзовая, уч.2А',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Березовая, д 2А',
        }, {
            'address': 'п.Малое Васильково, ул.Кленовая, уч.10/1',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Кленовая, д 10/1',
        }, {
            'address': 'п.Малое Васильково, ул.Сосновая, уч.14',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Сосновая, д 14',
        }, {
            'address': 'п.Малое Васильково, ул.Вишнёвая, уч.12',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Вишневая, д 12',
        }, {
            'address': 'п.Малое Васильково, ул.Кленовая, уч.6',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Кленовая, д 6',
        }, {
            'address': 'п.Малое Васильково, ул.Кленовая, уч.5',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Кленовая, д 5',
        }, {
            'address': 'п.Малое Васильково, ул.Вишнёвая, уч.31',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Вишневая, д 31',
        }, {
            'address': 'п.Малое Васильково, ул.Сосновая, уч.16',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Сосновая, д 16',
        }, {
            'address': 'п.Малое Васильково, ул.Берёзовая, уч.5',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Березовая, д 5',
        }, {
            'address': 'п.Малое Васильково, ул.Сосновая, уч.6',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Сосновая, д 6',
        }, {
            'address': 'п.Малое Васильково, ул.Берёзовая, уч.8',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Березовая, д 8',
        }, {
            'address': 'п.Малое Васильково, ул.Кленовая, уч.3',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Кленовая, д 3',
        }, {
            'address': 'п.Малое Васильково, ул.Берёзовая, уч.11',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Березовая, д 11',
        }, {
            'address': 'п.Малое Васильково, ул.Берёзовая, уч.6',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Березовая, д 6',
        }, {
            'address': 'п.Малое Васильково, ул.Сосновая, уч.2',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Сосновая, д 2',
        }, {
            'address': 'п.Малое Васильково, ул.Сосновая, уч.8',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Сосновая, д 8',
        }, {
            'address': 'п.Малое Васильково, ул.Кленовая, уч.1',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Кленовая, д 1',
        }, {
            'address': 'п.Малое Васильково, ул.Кленовая, уч.7',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Кленовая, д 7',
        }, {
            'address': 'п.Малое Васильково, ул.Кленовая, уч.11',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Кленовая, д 11',
        }, {
            'address': 'п.Малое Васильково, ул.Вишнёвая, уч.13',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Вишневая, д 13',
        }, {
            'address': 'п.Малое Васильково, ул.Берёзовая, уч.7',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Березовая, д 7',
        }, {
            'address': 'п.Малое Васильково, ул.Берёзовая, уч.9',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Березовая, д 9',
        }, {
            'address': 'п.Малое Васильково, ул.Кленовая, уч.10/2',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Кленовая, д 10/2',
        }, {
            'address': 'п.Малое Васильково, ул.Кленовая, уч.8',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Кленовая, д 8',
        }, {
            'address': 'п.Малое Васильково, ул.Берёзовая, уч.1',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Березовая, д 1',
        }, {
            'address': 'п.Малое Васильково, ул.Берёзовая, уч.3',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Березовая, д 3',
        }, {
            'address': 'п.Малое Васильково, ул.Сосновая, уч.10',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Сосновая, д 10',
        }, {
            'address': 'п.Малое Васильково, ул.Берёзовая, уч.2А',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Березовая, д 2А',
        }, {
            'address': 'п.Малое Васильково, ул.Кленовая, уч.1',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Кленовая, д 1',
        }, {
            'address': 'п.Малое Васильково, ул.Вишнёвая, уч.21',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Вишневая, д 21',
        }, {
            'address': 'п.Малое Васильково, ул.Вишнёвая, уч.2',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Вишневая, д 2',
        }, {
            'address': 'п.Малое Васильково, ул.Вишнёвая, уч.17',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Вишневая, д 17',
        }, {
            'address': 'п.Малое Васильково, ул.Берёзовая, уч.6',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Березовая, д 6',
        }, {
            'address': 'п.Малое Васильково, ул.Вишнёвая, уч.16',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Вишневая, д 16',
        }, {
            'address': 'п.Малое Васильково, ул.Сосновая, уч.5',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Сосновая, д 5',
        }, {
            'address': 'п.Малое Васильково, ул.Сосновая, уч.8',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Сосновая, д 8',
        }, {
            'address': 'п.Малое Васильково, ул.Кленовая, уч.10/1',
            'normalizedAddress': MAIN_ADDRESS_PART + 'ул Кленовая, д 10/1',
        }],
}


describe('Cottage village choose address from organization properties',   () => {
    it('should work', async () => {
        const { organizationProperties, integrationInputs } = COTTAGE_VILLAGE_TEST_CASE
        const resolver = new PropertyResolver({ billingContext: { settings: { isCottageVillage: true } } })
        resolver.propertyFinder.init(organizationProperties)
        const receipts = await resolver.normalizeAddresses(integrationInputs)
        for (const [, receipt] of Object.entries(receipts) ) {
            expect(receipt.addressResolve.propertyAddress.address).toEqual(receipt.normalizedAddress)
            expect(receipt.addressResolve.unitName).toEqual(1)
            expect(receipt.addressResolve.unitType).toEqual('flat')
        }
    })
})

describe('PropertyFinder', () => {
    const { organizationProperties } = COTTAGE_VILLAGE_TEST_CASE
    const finder = new PropertyFinder()
    finder.init(organizationProperties)
    it('should correctly extract tokens from address', () => {
        const tokens = finder.getTokensFromAddress('п.Малое Васильково, ул.Вишнёвая, уч.10')
        expect(tokens).toEqual(['малое', 'васильково', 'ул', 'вишневая', 'уч', '10'])
    })
    it('should correctly choose property', () => {
        const { address } = finder.findPropertyByOrganizationAndAddress('п.Малое Васильково, ул.Вишнёвая, уч.10')
        expect(address).toEqual(MAIN_ADDRESS_PART + 'ул Вишневая, д 10')
    })
})

