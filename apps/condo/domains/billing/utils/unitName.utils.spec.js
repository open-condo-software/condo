const  { normalizeUnitName } = require('./unitName.utils')

const TEST_CASES = {
    ru: [
        ['  \n  1 \u200B  ', '1'],
        ['.1.', '1'],
        [',1,', '1'],
        ['#23', '23'],
        ['N°17', '17'],
        ['3-8-13', '3-8-13'],
        ['12/2', '12-2'],
        ['LXXVIII', 'lxxviii'],
        ['VI A', 'vi-a'],
        ['1 a', '1-a'],
        ['1   a', '1-a'],
        ['1', '1'],
        ['1a', '1-a'],
        ['123asd', '123-asd'],
        ['39/ЖП', '39-zhp'],
        ['39-ЖП', '39-zhp'],
        ['12/A', '12-a'],
        ['410 K.', '410-k'],
        ['кв. 1-a', 'kv-1-a'],
        ['кв 1-a', 'kv-1-a'],
        ['квартира 1-a', 'kvartira-1-a'],
        ['корпус 1-a', 'korpyc-1-a'],
        ['к. 1-a', 'k-1-a'],
        ['к 1-a', 'k-1-a'],
        ['кладовая 1-a', 'kladovaya-1-a'],
        ['кл. 1-a', 'kl-1-a'],
        ['к/п 4', 'k-p-4'],
        ['оф 4', 'of-4'],
        ['оф. 4', 'of-4'],
        ['подвал 4', 'podval-4'],
        ['м/м 4', 'm-m-4'],
        ['а/м. 4', 'a-m-4'],
        ['мм 132', 'mm-132'],
        ['кл.кл. 132', 'kl-kl-132'],
        ['НП1', 'hp-1'],
        ['Н70', 'h-70'],
        ['Ю-122', 'yu-122'],
        ['кв.1', 'kv-1'],
        ['кв1', 'kv-1'],
        ['к1', 'k-1'],
        ['к/п4', 'k-p-4'],
        ['АП141', 'ap-141'],
        ['770М', '770-m'],
        ['770м', '770-m'],
        ['770 м', '770-m'],
        ['770 М', '770-m'],
        ['770-M', '770-m'],
        ['770-m', '770-m'],
        ['Особняк Оксфорд', 'ocobhyak-okcford'],
        ['к', 'k'],
        ['нет', 'het'],
        ['0-1', '0-1'],
        ['3-8-13\n', '3-8-13'],
        ['050-2/1', '050-2-1'],
        ['кл.кл. 3 (19Б кв. 14)', 'kl-kl-3-19-b-kv-14'],
        ['4 (1 ур.)', '4-1-yr'],
        ['21(кв.30)', '21-kv-30'],
        ['"с4,кв6,7."', 'c-4-kv-6-7'],
        ['3-12-15 (933Н)', '3-12-15-933-h'],
        ['-', ''],
        ['37(ЛС 0007000037)', '37-lc-0007000037'],
        ['ежилое помещение 11', 'ezhiloe-pomeschehie-11'],
        ['28Н ком.1', '28-h-kom-1'],
        ['х41м001', 'x-41-m-001'],
        ['1₽7', '1-7'],
        ['I м/м 24', 'i-m-m-24'],
        ['47;48', '47-48'],
        [')', ''],
        [')))', ''],
        ['*', ''],
        ['+', ''],
        [',', ''],
        ['-', ''],
        ['×', ''],
        ['•', ''],
        ['…', ''],
        ['⛔', ''],
        ['(€(', ''],
        ['', ''],
        ['/', ''],
        [':)', ''],
        ['=', ''],
        ['?', ''],
        [':', ''],
        ['@', ''],
        ['XII', 'xii'],
        ['КЛ88Н', 'kl-88-h'],
    ],
    en: [
        ['Apart. VI A', 'apart-vi-a'],
        ['Apt 5B', 'apt-5-b'],
        ['Apartment 12C', 'apartment-12-c'],
        ['Suite 405', 'suite-405'],
        ['Apt. #3D', 'apt-3-d'],
        ['Apartment #3C', 'apartment-3-c'],
        ['Apt C5', 'apt-c-5'],
        ['Ap. 4A', 'ap-4-a'],
        ['Apart. 22B', 'apart-22-b'],
        ['Flat 2B', 'flat-2-b'],
        ['Suite 12', 'suite-12'],
        ['#15', '15'],
        ['Flat 3C', 'flat-3-c'],
        ['Apt. #7D', 'apt-7-d'],
        ['Flat A1', 'flat-a-1'],
        ['FlatA1', 'flata-1'],
        ['Apt.#7D', 'apt-7-d'],
        [' (Apartement #1A)', 'apartement-1-a'],
    ],
}

const TEST_CASES_SYMBOLS = {
    ru: [
        ['А', 'a'],
        ['Б', 'b'],
        ['В', 'v'],
        ['Г', 'g'],
        ['Д', 'd'],
        ['Е', 'e'],
        ['Ё', 'e'],
        ['Ж', 'zh'],
        ['З', 'z'],
        ['И', 'i'],
        ['Й', 'j'],
        ['К', 'k'],
        ['Л', 'l'],
        ['М', 'm'],
        ['Н', 'h'],
        ['О', 'o'],
        ['П', 'p'],
        ['Р', 'r'],
        ['С', 'c'],
        ['Т', 't'],
        ['У', 'y'],
        ['Ф', 'f'],
        ['Х', 'x'],
        ['Ц', 'tc'],
        ['Ч', 'ch'],
        ['Ш', 'sh'],
        ['Щ', 'sch'],
        ['Ъ', ''],
        ['Ы', 'ij'],
        ['Ь', ''],
        ['Э', 'e'],
        ['Ю', 'yu'],
        ['Я', 'ya'],
    ],
}

const TEST_CASES_SYMBOLS_EQUAL = [
    ['A', 'А'],
    ['B', 'В'],
    ['C', 'С'],
    ['E', 'Е'],
    ['E', 'Ё'],
    ['H', 'Н'],
    ['K', 'К'],
    ['M', 'М'],
    ['O', 'О'],
    ['P', 'Р'],
    ['T', 'Т'],
    ['X', 'Х'],
    ['Y', 'У'],
]

describe('normalizeUnitName', () => {

    describe('normalize unitName', () => {
        for (const locale in TEST_CASES) {
            test.each(TEST_CASES[locale])(`Should convert "%s" to "%s" with locale ${locale}`,
                (unitNameRaw, expectedNormalizedUnitName) =>
                    expect(normalizeUnitName(unitNameRaw, locale)).toEqual(expectedNormalizedUnitName)
            )
        }
    })

    describe('normalize symbol', () => {
        for (const locale in TEST_CASES_SYMBOLS) {
            test.each(TEST_CASES_SYMBOLS[locale])(`Should convert сyrillic symbol "%s" to english symbol "%s" with locale ${locale}`,
                (unitNameRaw, expectedNormalizedUnitName) =>
                    expect(normalizeUnitName(unitNameRaw, locale)).toEqual(expectedNormalizedUnitName)
            )
        }
    })

    describe('similar symbols in different ru and en locale are equal', () => {
        test.each(TEST_CASES_SYMBOLS_EQUAL)('English symbol "%s" should equal to сyrillic symbol "%s"',
            (unitNameRaw, expectedNormalizedUnitName) =>
                expect(normalizeUnitName(unitNameRaw)).toEqual(normalizeUnitName(expectedNormalizedUnitName))
        )
    })

})