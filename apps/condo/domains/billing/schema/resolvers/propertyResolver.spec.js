const { AddressFromStringParser } = require('@open-condo/clients/address-service-client/utils/parseAddressesFromString')

const { getAddressFromReceipt } = require('./propertyResolver')

const PARSE_ADDRESS_CASES_PRIORITIES = [
    // When address is the only source of information
    { description: 'address for the unit', receipt: { address: 'пер.Малый Козихинский, д.7, м/м 3,4 (1 ур.)' }, result: { addresses: ['пер.Малый Козихинский, д.7'], unitName: '3,4 (1 ур.)', unitType: 'parking' } },
    { description: 'address for a single house', receipt: { address: 'пер.Малый Козихинский, д.7' }, result: { addresses: ['пер.Малый Козихинский, д.7'], unitName: '1', unitType: 'flat' } },
    { description: 'unitType is not in our type', receipt: { address: 'пер.Малый Козихинский, д.7', addressMeta: { unitName: '3,4 (1 ур.)', unitType: 'машиноместо' } }, result: { addresses: ['пер.Малый Козихинский, д.7'], unitName: '3,4 (1 ур.)', unitType: 'parking' } },
    { description: 'unitType is in our type', receipt: { address: 'пер.Малый Козихинский, д.7', addressMeta: { unitName: '3,4 (1 ур.)', unitType: 'warehouse' }  }, result: { addresses: ['пер.Малый Козихинский, д.7'], unitName: '3,4 (1 ур.)', unitType: 'warehouse' } },
    { description: 'addressMeta unit has priority over parsed unit', receipt: { address: 'пер.Малый Козихинский, д.7, м/м 99', addressMeta: { unitName: '42', unitType: 'flat' } }, result: { addresses: ['пер.Малый Козихинский, д.7, м/м 99'], unitName: '42', unitType: 'flat' } },
    { description: 'explicit unit metadata preserves the complete house address', receipt: { address: 'Москва, ул. Ленина, д. 7, корп. 2', addressMeta: { unitName: '42', unitType: 'flat' } }, result: { addresses: ['Москва, ул. Ленина, д. 7, корп. 2'], unitName: '42', unitType: 'flat' } },
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
    const parser = new AddressFromStringParser()
    for (const { description, receipt, result } of PARSE_ADDRESS_CASES_PRIORITIES) {
        test(description, () => {
            const { addresses, unitName, unitType } = getAddressFromReceipt(receipt, { parser })
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
    const parser = new AddressFromStringParser()

    for (const input of SINGLE_HOUSE_TEST_CASES) {
        test(`"${input}" to be: "${input}" `, () => {
            const { address, unitType, unitName } = parser.parse(input)
            expect(address).toEqual(input)
            expect(unitType).toEqual('flat')
            expect(unitName).toEqual('1')
        })
    }
    for (const input of SINGLE_HOUSE_WITH_MODIFIED_ADDRESS_TEST_CASES) {
        test(`"${input}" to be: "${input}" `, () => {
            const { address, unitType, unitName } = parser.parse(input)
            expect(address).not.toEqual(input)
            expect(unitType).toEqual('flat')
            expect(unitName).toEqual('1')
        })
    }
    for (const input of NOT_SINGLE_HOUSE_TEST) {
        test(`"${input}" to be: "${input}" `, () => {
            const { address, unitName } = parser.parse(input)
            expect(address).not.toEqual(input)
            expect(unitName).not.toEqual('1')
        })
    }

})
