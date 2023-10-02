const iconv = require('iconv-lite')

const { ConvertToUTF8 } = require('./convertToUTF8')

const TEST_STRING = 'Тестовая строка'
const ENCODINGS = [ 'utf-8', 'koi8-r', 'windows-1251', 'ibm866' ]


describe('convertToUTF8', () => {
    afterAll( () => {
        if (global.gc) {
            global.gc()
        }
    })
    describe('convert', () => {
        ENCODINGS.forEach(encoding => {
            it(`should convert ${encoding} to UTF-8`, () => {
                const buffer = iconv.encode(TEST_STRING, encoding)
                const toUTF8 = new ConvertToUTF8(buffer)

                const { encoding: actualEncoding, result } = toUTF8.convert()
                expect(actualEncoding).toEqual(encoding.toUpperCase())
                expect(result).toEqual(TEST_STRING)
            })
        })
    })
})
