const { AddressTransform, AddressParser } = require('./AddressTransform')

const rules = {
    'ул.Революции 1905 года': 'г. Новороссийск, ул.Революции 1905 года',
    'r^(.*?)\\sК.$': 'Самара, $1',
    ...JSON.parse('{"r^Автопарковка (.*?)№(.*?)$": "$1 м/м $2"}'),
}

const PARSER_CASES = [
    ['пер.Малый Козихинский, д.7, м/м 3,4 (1 ур.)', 'ПЕР.МАЛЫЙ КОЗИХИНСКИЙ, Д.7', 'parking', '3,4 (1 УР.)'],
    ['пер.Малый Козихинский, дом 7, м/м 10,13 (1 ур.)', 'пер.Малый Козихинский, дом 7', 'parking', '10,13 (1 УР.)'],
    ['г.Копейск ул.Короленко д.4Б кв.39/ЖП', 'г.Копейск ул.Короленко д.4Б', 'flat', '39/ЖП'],
    ['г. Нижний Новгород, пер. Плотничный, дом 2, корпус 1 парковка, а/м 5', 'Г. НИЖНИЙ НОВГОРОД, ПЕР. ПЛОТНИЧНЫЙ, ДОМ 2, КОРПУС 1', 'parking', '5'],
    ['г. Нижний Новгород, пер. Плотничный, дом 2, корпус 1, оф. 1', 'Г. НИЖНИЙ НОВГОРОД, ПЕР. ПЛОТНИЧНЫЙ, ДОМ 2, КОРПУС 1', 'commercial', '1'],
    ['г.Пермь, ул. Макаренко д. 12/А кв. 104', 'Г.ПЕРМЬ, УЛ. МАКАРЕНКО Д. 12/А', 'flat', '104'],
    ['РОССИЯ, 105082, Москва г, Спартаковская пл, Дом 14стр. 4, мм 132', 'РОССИЯ, 105082, МОСКВА Г, СПАРТАКОВСКАЯ ПЛ, ДОМ 14СТР. 4', 'parking', '132'],
    ['РОССИЯ, 105082, Москва г, Спартаковская пл, Дом 14стр. 2, Особняк Оксфорд', 'РОССИЯ, 105082, МОСКВА Г, СПАРТАКОВСКАЯ ПЛ, ДОМ 14СТР. 2', 'flat', 'ОСОБНЯК ОКСФОРД'],
    ['РОССИЯ, 105082, Москва г, Спартаковская пл, Дом 14стр. 4, комн. 26', 'РОССИЯ, 105082, МОСКВА Г, СПАРТАКОВСКАЯ ПЛ, ДОМ 14СТР. 4', 'flat', '26'],
    ['357500, край Ставропольский, г Пятигорск, пер Березовый, д. 13, к. 3, подвал 1', '357500, КРАЙ СТАВРОПОЛЬСКИЙ, Г ПЯТИГОРСК, ПЕР БЕРЕЗОВЫЙ, Д. 13, К. 3', 'warehouse', '1'],
    ['УЛ СЪЕЗДОВСКАЯ Д. 11 КВ. 410 К.', 'УЛ СЪЕЗДОВСКАЯ Д. 11', 'flat', '410 К'],
    ['ул.2-я Линейная, д.19, кл.кл. 3 (19Б кв. 14)', 'ул.2-я Линейная, д.19', 'warehouse', '3 (19Б 14)'],
    ['Нововладыкинский пр-д, д.1 корпус 4, кв.6', 'НОВОВЛАДЫКИНСКИЙ ПР-Д, Д.1 КОРПУС 4', 'flat', '6'],
    ['ул.2-я Линейная, д.19, кл.59 (19Дк1 кв.67)', 'УЛ.2-Я ЛИНЕЙНАЯ, Д.19', 'warehouse', '59 (19ДК1 67)'],
    ['ул.Щорса,103,212', 'УЛ.ЩОРСА, 103', 'flat', '212'],

    // fias cases
    ['fiasId:b746e6bd-e02b-4987-bb1c-bb9dd808f909', 'fiasId:b746e6bd-e02b-4987-bb1c-bb9dd808f909', 'flat', ''],
    ['fiasId:b746e6bd-e02b-4987-bb1c-bb9dd808f909, кв. 1', 'fiasId:b746e6bd-e02b-4987-bb1c-bb9dd808f909', 'flat', '1'],
    ['fiasId:b746e6bd-e02b-4987-bb1c-bb9dd808f909, парковка 1', 'fiasId:b746e6bd-e02b-4987-bb1c-bb9dd808f909', 'parking', '1'],
    ['fiasId:b746e6bd-e02b-4987-bb1c-bb9dd808f909, м/м   1', 'fiasId:b746e6bd-e02b-4987-bb1c-bb9dd808f909', 'parking', '1'],
]

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
]

describe('Parsing unit names with unit types from address strings', () => {
    for (const rawData of PARSER_CASES) {
        const [ rawInput, house, unitType, unit ] = rawData
        test(`"${rawInput}" to be: "${house} = ${unitType} = ${unit}" `, () => {
            const parser = new AddressParser()
            const { address, unitName: parsedUnit, unitType: parsedUnitType } = parser.parse(rawInput)
            expect(address.toUpperCase()).toEqual(house.toUpperCase())
            expect(parsedUnit.toUpperCase()).toEqual(unit.toUpperCase())
            expect(unitType.toUpperCase()).toEqual(parsedUnitType.toUpperCase())
        })
    }
})

describe('Transform address according to context rules', () => {
    for (const rawData of TRANSFORM_CASES) {
        const { input, output } = rawData
        test(`"${input}" to be: "${output}" `, () => {
            const transform = new AddressTransform()
            const initResult = transform.init(rules)
            expect(initResult.error).not.toBeTruthy()
            expect(initResult.errorMessage).not.toBeTruthy()

            const result = transform.apply(input)
            expect(result).toEqual(output)
        })
    }
})
