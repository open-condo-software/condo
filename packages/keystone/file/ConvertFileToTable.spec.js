const { readFileSync } = require('fs')

const iconv = require('iconv-lite')

const { ConvertFileToTable, TYPES } = require('./ConvertFileToTable')

const TEST_STRING = 'Тестовая строка'

const ENCODINGS = [ 'utf-8', 'koi8-r', 'windows-1251', 'ibm866' ]

const MOCK_FILES_PATH = '@registry/domains/format/lib/mock-files/'

const pathToFile = (fileName) => {
    return require.resolve(MOCK_FILES_PATH + fileName)
}

describe('ConvertFileToTable', () => {

    describe('ConvertFileToTable change encoding to UTF-8', () => {

        ENCODINGS.forEach(encoding => {
            test(`should convert ${encoding} to UTF-8`, async () => {
                const buffer = iconv.encode(TEST_STRING, encoding)
                const convertor = new ConvertFileToTable(buffer)
                const result = await convertor.convertEncoding(encoding)
                expect(result).toEqual(TEST_STRING)
            })
        })

    })

    const TEST_CASES = [
        { file: 'check.csv', type: TYPES.CSV },
        { file: 'check.dbf', type: TYPES.DBF },
        { file: 'check.xls', type: TYPES.EXCEL },
        { file: 'check.xlsx', type: TYPES.EXCEL },
        { file: 'check.png', type: TYPES.UNSUPPORTED },
        { file: 'check.zip', type: TYPES.UNSUPPORTED },
    ]

    describe('ConvertFileToTable works with file types', () => {

        describe('it should correctly detect file type', () => {
            for (const { file, type } of TEST_CASES) {
                test(`check for ${file}`, async () => {
                    const content = readFileSync(pathToFile(file))
                    const fileType = new ConvertFileToTable(content)
                    const result = await fileType.detectFileType()
                    expect(result).toEqual(type)
                })
            }
        })

        describe('isDBFFile', () => {
            test('should return true for DBF file', () => {
                const content = readFileSync(pathToFile('check.dbf'))
                const fileType = new ConvertFileToTable(content)
                expect(fileType.isDBFFile()).toBe(true)
            })

            test('should return false for non-DBF file', () => {
                const content = readFileSync(pathToFile('check.xlsx'))
                const fileType = new ConvertFileToTable(content)
                expect(fileType.isDBFFile()).toBe(false)
            })
        })

        describe('isTextFile', () => {
            test('should return true for CSV file with non-ASCII characters', () => {
                const content = readFileSync(pathToFile('check.csv'), 'utf-8')
                const fileType = new ConvertFileToTable(content)
                expect(fileType.isTextFile()).toBe(true)
            })

            test('should return false for non-CSV file', () => {
                const content = readFileSync(pathToFile('check.xlsx'))
                const fileType = new ConvertFileToTable(content)
                expect(fileType.isTextFile()).toBe(false)
            })
        })

        describe('isExcelFile', () => {
            test('should return true for XLSX file', async () => {
                const content = readFileSync(pathToFile('check.xlsx'))
                const fileType = new ConvertFileToTable(content)
                const result = await fileType.isExcelFile()
                expect(result).toBe(true)
            })

            test('should return true for XLS file', async () => {
                const content = readFileSync(pathToFile('check.xls'))
                const fileType = new ConvertFileToTable(content)
                const result = await fileType.isExcelFile()
                expect(result).toBe(true)
            })

            test('should return false for ZIP file', async () => {
                const content = readFileSync(pathToFile('check.zip'))
                const fileType = new ConvertFileToTable(content)
                const result = await fileType.isExcelFile()
                expect(result).toBe(false)
            })
        })

    })

    describe('ConvertFileToTable correctly extract data', () => {

        test('should correctly extract data from DBF file', async () => {
            const content = readFileSync(pathToFile('check.dbf'))
            const extract = new ConvertFileToTable(content)
            const result = await extract.getData()
            expect(result).toEqual([
                ['000150031/1', 'Жукова Лариса Ивановна', 'Химки г, Кудрявцева ул, дом № 15, Кв. 31', '1122', '6985.45' ],
                ['000150063/1', 'Пынзарь Артур Юрьевич', 'Химки г, Кудрявцева ул, дом № 15, Кв. 63', '1122', '15662.53' ],
            ])
        })

        test('should correctly extract data from Excel file', async () => {
            const content = readFileSync(pathToFile('check.xlsx'))
            const extract = new ConvertFileToTable(content)
            const result = await extract.getData()
            expect(result).toEqual([
                ['192011238', 'г. Казань, ул. Театральная, д.1, оф.1', '922', '8640.02', 'Отопление', '8240.02', 'Газ', '400' ],
                ['192018731', 'e7cff5f3-bbf1-46d1-8a99-f15f365060cd, кв.1', '922', '3355.06', 'Отопление', '3205.06', 'Газ', '150' ],
            ])
        })

        test('should correctly extract data from CSV file', async () => {
            const content = readFileSync(pathToFile('check.csv'))
            const extract = new ConvertFileToTable(content)
            const result = await extract.getData()
            expect(result).toEqual([
                ['1134969222', 'г. Копейск,ул. Короленко,12.А,1', '294,55', '0622'],
                ['1134969230', 'г. Копейск,ул. Короленко,12.А,2', '-1872,61', '0622'],
                ['1134969945', 'г. Копейск,ул. Короленко,12.А,3', '4231,93', '0622'],
            ])
        })

        test('it should remove empty lines and comment strings started with sharp sign', async () => {
            const content = readFileSync(pathToFile('with-comments.csv'))
            const extract = new ConvertFileToTable(content)
            const result = await extract.getData()
            expect(result).toEqual([
                ['1134969222', 'г. Копейск,ул. Короленко,12.А,1', '294,55', '0622'],
                ['1134969230', 'г. Копейск,ул. Короленко,12.А,2', '-1872,61', '0622'],
                ['1134969945', 'г. Копейск,ул. Короленко,12.А,3', '4231,93', '0622'],
            ])
        })

    })
})