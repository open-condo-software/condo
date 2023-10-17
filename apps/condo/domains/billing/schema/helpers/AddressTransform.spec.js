const { AddressTransform } = require('./AddressTransform')

const rules = {
    'ул.Революции 1905 года': 'г. Новороссийск, ул.Революции 1905 года',
    'r^(.*?)\\sК.$': 'Самара, $1',
    ...JSON.parse('{"r^Автопарковка (.*?)№(.*?)$": "$1 м/м $2"}'),
}

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


describe('Transform address according to context settings', () => {
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
