const { parseAddressesFromString, AddressFromStringParser } = require('./parseAddressesFromString')

const ADDRESS_USE_CASES = [
    ['пер.Малый Козихинский, д.7, м/м 3,4 (1 ур.)', 'пер.Малый Козихинский, д.7', 'parking', '3,4 (1 ур.)'],
    ['пер.Малый Козихинский, дом 7, м/м 10,13 (1 ур.)', 'пер.Малый Козихинский, дом 7', 'parking', '10,13 (1 ур.)'],
    ['г.Копейск ул.Короленко д.4Б кв.39/ЖП', 'г.Копейск ул.Короленко д.4Б', 'flat', '39/ЖП'],
    ['г. Нижний Новгород, пер. Плотничный, д. 2, корпус 1 а/м. 5', 'г. Нижний Новгород, пер. Плотничный, д. 2, корпус 1', 'parking', '5'],
    ['г. Нижний Новгород, пер. Плотничный, дом 2, корпус 1, оф. 1', 'г. Нижний Новгород, пер. Плотничный, дом 2, корпус 1', 'commercial', '1'],
    ['г.Пермь, ул. Макаренко д. 12/А кв. 104', 'г.Пермь, ул. Макаренко д. 12/А', 'flat', '104'],
    ['РОССИЯ, 105082, Москва г, Спартаковская пл, Дом 14стр. 4, мм 132', 'РОССИЯ, 105082, Москва г, Спартаковская пл, Дом 14стр. 4', 'parking', '132'],
    ['РОССИЯ, 105082, Москва г, Спартаковская пл, Дом 14стр. 2, Особняк Оксфорд', 'РОССИЯ, 105082, Москва г, Спартаковская пл, Дом 14стр. 2', 'flat', 'Особняк Оксфорд'],
    ['РОССИЯ, 105082, Москва г, Спартаковская пл, Дом 14стр. 4, комн. 26', 'РОССИЯ, 105082, Москва г, Спартаковская пл, Дом 14стр. 4', 'flat', '26'],
    ['357500, край Ставропольский, г Пятигорск, пер Березовый, д. 13, к. 3, подвал 1', '357500, край Ставропольский, г Пятигорск, пер Березовый, д. 13, к. 3', 'warehouse', '1'],
    ['УЛ СЪЕЗДОВСКАЯ Д. 11 КВ. 410 К.', 'УЛ СЪЕЗДОВСКАЯ Д. 11', 'flat', '410 К'],
    ['ул.2-я Линейная, д.19, кл.кл. 3 (19Б кв. 14)', 'ул.2-я Линейная, д.19', 'warehouse', '3 (19Б 14)'],
    ['Нововладыкинский пр-д, д.1 корпус 4, кв.6', 'Нововладыкинский пр-д, д.1 корпус 4', 'flat', '6'],
    ['ул.2-я Линейная, д.19, кл.59 (19Дк1 кв.67)', 'ул.2-я Линейная, д.19', 'warehouse', '59 (19Дк1 67)'],
    ['Москва, ул 2-я Линейная, д.19, кл.71', 'Москва, ул 2-я Линейная, д.19', 'warehouse', '71'],
    ['ул.Щорса,103,212', 'ул.Щорса, 103', 'flat', '212'],
    ['г. Москва, ул. Парковая д. 1, блок 5, кв 1', 'г. Москва, ул. Парковая д. 1, блок 5', 'flat', '1'],
    ['ул.Щорса, д 103, кладовая 212', 'ул.Щорса, д 103', 'warehouse', '212'],
    ['ул.Щорса, 103, кладовая 212', 'ул.Щорса, 103', 'warehouse', '212'],
    ['ул.Щорса, уч. 103', 'ул.Щорса, уч. 103', 'flat', '1'],
    ['ул.Щорса, двлд 12', 'ул.Щорса, двлд 12', 'flat', '1'],
    ['ул.Щорса двлд. 12', 'ул.Щорса двлд. 12', 'flat', '1'],
    ['ул.Щорса участок. 12,4', 'ул.Щорса участок. 12', 'flat', '4'],
    ['ул.Щорса участок. 12,к/п4', 'ул.Щорса участок. 12', 'apartment', '4'],
    ['d9c0f8c-c5ac-4a4b-808d-9637fd5f90a7,', 'd9c0f8c-c5ac-4a4b-808d-9637fd5f90a7', 'flat', '1'],
    ['671ea901-641e-4ce9-9815-604e7223de6c', '671ea901-641e-4ce9-9815-604e7223de6c', 'flat', '1'],
    ['Свердловская обл, Сысертский р-н, Сысерть г, Чернышевского ул, д. 10,', 'Свердловская обл, Сысертский р-н, Сысерть г, Чернышевского ул, д. 10', 'flat', '1'],
    ['Свердловская обл, Сысертский р-н, Асбест п, Ключевская ул, д. 1, 001', 'Свердловская обл, Сысертский р-н, Асбест п, Ключевская ул, д. 1', 'flat', '001'],
    ['Свердловская обл, Сысертский р-н, Асбест п, Ключевская ул, д. 1, кв 001', 'Свердловская обл, Сысертский р-н, Асбест п, Ключевская ул, д. 1', 'flat', '001'],
    ['Свердловская обл, Сысертский р-н, Асбест п, Ключевская ул, д. 1 кв 001', 'Свердловская обл, Сысертский р-н, Асбест п, Ключевская ул, д. 1', 'flat', '001'],
    ['Свердловская обл, Сысертский р-н, Асбест п, Ключевская ул, д. 1 кв 000', 'Свердловская обл, Сысертский р-н, Асбест п, Ключевская ул, д. 1', 'flat', '000'],
    ['Свердловская обл, Сысертский р-н, Асбест п, Ключевская ул, д. 1 кв 0', 'Свердловская обл, Сысертский р-н, Асбест п, Ключевская ул, д. 1', 'flat', '0'],
    ['Свердловская обл, Сысертский р-н, Асбест п, Ключевская ул, д. 1 кв 0-1', 'Свердловская обл, Сысертский р-н, Асбест п, Ключевская ул, д. 1', 'flat', '0-1'],
]

describe('AddressFromStringParser', () => {
    describe('Parsing unit names with unit types and house address from address strings', () => {
        for (const rawData of ADDRESS_USE_CASES) {
            const [ rawInput, house, unitType, unit ] = rawData
            test(`"${rawInput}" to be: "${house} = ${unitType} = ${unit}" `, () => {
                const [{ result: { address, unitName: parsedUnitName, unitType: parsedUnitType } }] = parseAddressesFromString([ rawInput ])
                expect(address).toEqual(house)
                expect(parsedUnitName).toEqual(unit)
                expect(unitType).toEqual(parsedUnitType)
            })
        }

        test('parseAddressesFromString should correctly parse multiple addresses', () => {
            const addresses = ['г. Казань, ул. Кремлевская, д. 18, кв. 25', 'г. Москва, ул. Пушкина, д. 10, кв. 5']
            const result = parseAddressesFromString(addresses)
            expect(result).toHaveLength(2)
            expect(result[0].result.address).toEqual('г. Казань, ул. Кремлевская, д. 18')
            expect(result[0].result.unitName).toEqual('25')
            expect(result[1].result.address).toEqual('г. Москва, ул. Пушкина, д. 10')
            expect(result[1].result.unitName).toEqual('5')
        })
    })

    describe('check AddressFromStringParser methods', () => {

        test('parseUnit should return flat if no unit type is detected', () => {
            const parser = new AddressFromStringParser()
            const unitInput = 'Flat 1'
            const result = parser.parseUnit(unitInput)
            expect(result.unitType).toEqual('flat')
        })

        test('parseUnit should correctly detect unit types', () => {
            const parser = new AddressFromStringParser()
            const unitInput = 'офис 123'
            const result = parser.parseUnit(unitInput)
            expect(result.unitType).toEqual('commercial')
        })

        test('splitByKeyword should return empty unitPart if no unit is found', () => {
            const parser = new AddressFromStringParser()
            const input = 'г. Москва, ул. Пушкина, д. 10'
            const result = parser.splitByKeyword(input)
            expect(result.unitPart).toEqual('')
        })

        test('splitToUnitAndAddress should correctly split addresses', () => {
            const parser = new AddressFromStringParser()
            const input = 'г. Казань, ул. Кремлевская, д. 18, кв. 25'
            const result = parser.splitToUnitAndAddress(input)
            expect(result.housePart).toEqual('г. Казань, ул. Кремлевская, д. 18')
            expect(result.unitPart).toEqual('кв 25')
        })
    })
})


