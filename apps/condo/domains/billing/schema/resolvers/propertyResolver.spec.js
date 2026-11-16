const { AddressTransform, PropertyResolver } = require('./propertyResolver')

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
    { description: 'addressMeta unit has priority over parsed unit', receipt: { address: 'пер.Малый Козихинский, д.7, м/м 99', addressMeta: { unitName: '42', unitType: 'flat' } }, result: { addresses: ['пер.Малый Козихинский, д.7'], unitName: '42', unitType: 'flat' } },
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

const SINGLE_HOUSE_TEST_CASES = [
    'ул.Революции 1905 года, д 37',
    'ул.Революции 1905 года, д.37',
    'ул.Революции 1905 года, дом 37',
    'ул.Революции 1905 года, двлд.37',
    'ул.Революции 1905 года, двлд 37',
    'ул.Революции 1905 года, участок 37',
    'ул.Революции 1905 года, уч. 37',
    'ул.Революции 1905 года, уч.37',
    'ул.Революции 1905 года, уч 37',
]
const SINGLE_HOUSE_WITH_MODIFIED_ADDRESS_TEST_CASES = [
    'ул.Революции 1905 года, двлд 37,',
]
const NOT_SINGLE_HOUSE_TEST = [
    'ул.Революции 1905 года, д 37, 2',
]

describe('Single houses will add an empty unit', () => {
    const resolver = new PropertyResolver({})

    for (const input of SINGLE_HOUSE_TEST_CASES) {
        test(`"${input}" to be: "${input}" `, () => {
            const { address, unitType, unitName } = resolver.parser.parse(input)
            expect(address).toEqual(input)
            expect(unitType).toEqual('flat')
            expect(unitName).toEqual('1')
        })
    }
    for (const input of SINGLE_HOUSE_WITH_MODIFIED_ADDRESS_TEST_CASES) {
        test(`"${input}" to be: "${input}" `, () => {
            const { address, unitType, unitName } = resolver.parser.parse(input)
            expect(address).not.toEqual(input)
            expect(unitType).toEqual('flat')
            expect(unitName).toEqual('1')
        })
    }
    for (const input of NOT_SINGLE_HOUSE_TEST) {
        test(`"${input}" to be: "${input}" `, () => {
            const { address, unitName } = resolver.parser.parse(input)
            expect(address).not.toEqual(input)
            expect(unitName).not.toEqual('1')
        })
    }

})
