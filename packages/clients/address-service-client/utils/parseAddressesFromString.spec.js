const { parseAddressesFromString, AddressFromStringParser, isAddressUUID } = require('./parseAddressesFromString')

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
    ['ул.Щорса участок. 12,к/п.4', 'ул.Щорса участок. 12', 'apartment', '4'],
    ['ул.Щорса участок. 12,кл.20(кв.40)', 'ул.Щорса участок. 12', 'warehouse', '20(40)'],
    ['d9c0f8c-c5ac-4a4b-808d-9637fd5f90a7,', 'd9c0f8c-c5ac-4a4b-808d-9637fd5f90a7', 'flat', '1'],
    ['671ea901-641e-4ce9-9815-604e7223de6c', '671ea901-641e-4ce9-9815-604e7223de6c', 'flat', '1'],
    ['Свердловская обл, Сысертский р-н, Сысерть г, Чернышевского ул, д. 10,', 'Свердловская обл, Сысертский р-н, Сысерть г, Чернышевского ул, д. 10', 'flat', '1'],
    ['Свердловская обл, Сысертский р-н, Асбест п, Ключевская ул, д. 1, 001', 'Свердловская обл, Сысертский р-н, Асбест п, Ключевская ул, д. 1', 'flat', '001'],
    ['Свердловская обл, Сысертский р-н, Асбест п, Ключевская ул, д. 1, кв 001', 'Свердловская обл, Сысертский р-н, Асбест п, Ключевская ул, д. 1', 'flat', '001'],
    ['Свердловская обл, Сысертский р-н, Асбест п, Ключевская ул, д. 1 кв 001', 'Свердловская обл, Сысертский р-н, Асбест п, Ключевская ул, д. 1', 'flat', '001'],
    ['Свердловская обл, Сысертский р-н, Асбест п, Ключевская ул, д. 1 кв 000', 'Свердловская обл, Сысертский р-н, Асбест п, Ключевская ул, д. 1', 'flat', '000'],
    ['Свердловская обл, Сысертский р-н, Асбест п, Ключевская ул, д. 1 кв 0', 'Свердловская обл, Сысертский р-н, Асбест п, Ключевская ул, д. 1', 'flat', '0'],
    ['Свердловская обл, Сысертский р-н, Асбест п, Ключевская ул, д. 1 кв 0-1', 'Свердловская обл, Сысертский р-н, Асбест п, Ключевская ул, д. 1', 'flat', '0-1'],
    ['г. Тест, ул. Пример, д. 1, НП10', 'г. Тест, ул. Пример, д. 1', 'warehouse', 'НП10'],
    ['г. Тест, ул. Пример, д. 1, клад.12', 'г. Тест, ул. Пример, д. 1', 'warehouse', '12'],
    ['г. Тест, ул. Пример, д. 1, клад12', 'г. Тест, ул. Пример, д. 1', 'warehouse', 'клад12'],
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

    describe('parseExplicit', () => {
        test.each([
            '',
            '   ',
            'г Москва, ул Хабаровская, д 5',
            'г Москва, ул Ленина, д. 12, к. 2',
            'г Москва, ул Ленина, д. 12, стр. 2',
            'г Колпино, ул Промышленная, д. 3, литер А',
            'г Москва, кв-л Солнечный, д. 1',
            'г Москва, ул Квартальная, д. 1',
            'ул Щорса, уч. 103',
            '671ea901-641e-4ce9-9815-604e7223de6c',
        ])('preserves the house and returns empty unit fields for "%s"', (input) => {
            const parser = new AddressFromStringParser()

            expect(parser.parseExplicit(input)).toEqual({
                address: input.trim(),
                unitName: null,
                unitType: null,
                hasUnit: false,
            })
        })

        test.each([
            ['г Москва, ул Ленина, д. 12, кв.001', 'г Москва, ул Ленина, д. 12', '001', 'flat'],
            ['г Москва, ул Ленина, д. 12 кв 000', 'г Москва, ул Ленина, д. 12', '000', 'flat'],
            ['г Москва, ул Ленина, д. 12, кв.0', 'г Москва, ул Ленина, д. 12', '0', 'flat'],
            ['г Краснодар, кв.001, ул Ленина, д. 5', 'г Краснодар, ул Ленина, д. 5', '001', 'flat'],
            ['г Москва, ул Ленина, д. 12, кв.001, к. 2', 'г Москва, ул Ленина, д. 12, к. 2', '001', 'flat'],
            ['г Москва, ул Ленина, д. 12, оф.7', 'г Москва, ул Ленина, д. 12', '7', 'commercial'],
            ['г Москва, ул Ленина, д. 12, м/м ММ3', 'г Москва, ул Ленина, д. 12', 'ММ3', 'parking'],
            ['г Москва, ул Ленина, д. 12, апарт.1', 'г Москва, ул Ленина, д. 12', '1', 'apartment'],
            ['г Москва, ул Ленина, д. 12, н/п 3', 'г Москва, ул Ленина, д. 12', '3', 'warehouse'],
            ['г Москва, ул Ленина, д. 12, ком.1', 'г Москва, ул Ленина, д. 12', '1', 'flat'],
            ['г Москва, ул Ленина, д. 12, комната 1', 'г Москва, ул Ленина, д. 12', '1', 'flat'],
            ['г Москва, ул Ленина, д. 12, 001', 'г Москва, ул Ленина, д. 12', '001', null],
            ['г Москва, ул Ленина, д. 12, № 1', 'г Москва, ул Ленина, д. 12', '1', null],
            ['г Москва, ул Ленина, д. 12, кв.53/1', 'г Москва, ул Ленина, д. 12', '53/1', 'flat'],
            ['г Москва, ул Ленина, д. 12, кв.5,31,32', 'г Москва, ул Ленина, д. 12', '5, 31, 32', 'flat'],
            ['г Москва, ул Ленина, д. 12, кл.1 (кв.25)', 'г Москва, ул Ленина, д. 12', '1 (кв.25)', 'warehouse'],
            ['г Москва, ул Ленина, д. 12, кв.1, ком.1, 2, 3, 4', 'г Москва, ул Ленина, д. 12', '1, ком.1, 2, 3, 4', 'flat'],
            ['г Колпино, ул Промышленная, д. 3, литер А, нп.1-Н, 2-Н', 'г Колпино, ул Промышленная, д. 3, литер А', '1-Н, 2-Н', 'warehouse'],
            ['ул Мира, д. 29, нп.подвал, этаж№1, этаж№2, мансарда', 'ул Мира, д. 29', 'подвал, этаж№1, этаж№2, мансарда', 'warehouse'],
            ['ул Гамарника, д. 17, нп.-I (1-6, 8-10, 14-20)', 'ул Гамарника, д. 17', '-I (1-6, 8-10, 14-20)', 'warehouse'],
        ])('extracts the complete unit from "%s"', (input, address, unitName, unitType) => {
            const parser = new AddressFromStringParser()

            expect(parser.parseExplicit(input)).toEqual({ address, unitName, unitType, hasUnit: true })
        })

        test('keeps an empty unit marker so the caller can report a missing number', () => {
            const parser = new AddressFromStringParser()

            expect(parser.parseExplicit('г Москва, ул Ленина, д. 12, кв.')).toEqual({
                address: 'г Москва, ул Ленина, д. 12',
                unitName: null,
                unitType: 'flat',
                hasUnit: true,
            })
        })
    })

    describe('parseUnitDescription', () => {
        test.each([
            ['', null, null],
            ['   ', null, null],
            ['001', '001', null],
            ['№ 001', '001', null],
            ['НП10', '10', 'warehouse'],
            ['кладовая001', '001', 'warehouse'],
            ['кв.0', '0', 'flat'],
            ['ком.1', '1', 'flat'],
            ['комната 1', '1', 'flat'],
            ['офис 123', '123', 'commercial'],
            ['апарт.1', '1', 'apartment'],
            ['м/м ММ3', 'ММ3', 'parking'],
            ['н/п 3', '3', 'warehouse'],
            ['кв.39/ЖП', '39/ЖП', 'flat'],
            ['кв.1, ком.1, 2, 3, 4', '1, ком.1, 2, 3, 4', 'flat'],
            ['кл.1 ( кв.25 )', '1 (кв.25)', 'warehouse'],
            ['помещение подвал, этаж№1, секция А', 'подвал, этаж№1, секция А', 'warehouse'],
            ['Квартальная', 'Квартальная', null],
        ])('parses "%s" and preserves its unit description', (input, unitName, unitType) => {
            const parser = new AddressFromStringParser()

            expect(parser.parseUnitDescription(input)).toEqual({ unitName, unitType })
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
            expect(result.unitPart).toEqual('кв. 25')
        })
    })
})


describe('isAddressUUID', () => {
    test.each([
        '671ea901-641e-4ce9-9815-604e7223de6c',
        '671EA901-641E-4CE9-9815-604E7223DE6C',
    ])('recognizes "%s"', (input) => {
        expect(isAddressUUID(input)).toBe(true)
    })

    test.each([
        '',
        'г Москва, ул Ленина, д. 12',
        '671ea901-641e-4ce9-9815-604e7223de6',
        '671ea901-641e-4ce9-9815-604e7223de6z',
        '671ea901641e4ce99815604e7223de6c',
        '671ea901-641e-4ce9-9815-604e7223de6c, кв.1',
        '671ea901-641e-4ce9-9815-604e7223de6c ',
        ' 671ea901-641e-4ce9-9815-604e7223de6c',
    ])('rejects "%s"', (input) => {
        expect(isAddressUUID(input)).toBe(false)
    })
})
