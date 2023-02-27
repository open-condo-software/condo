const fs = require('fs')
const path = require('path')
const { Readable } = require('stream')

const dayjs = require('dayjs')
const customParseFormat = require('dayjs/plugin/customParseFormat')

const conf = require('@open-condo/config')
const { catchErrorFrom } = require('@open-condo/keystone/test.utils')

const { PARSED_TRANSACTIONS_TO_COMPARE } = require('@condo/domains/banking/utils/testSchema/assets/1CClientBankExchangeToKeystoneObjects')

const { convertFrom1CExchangeToSchema } = require('./convertFrom1CExchangeToSchema')

let fileReadStream

const filePath = path.resolve(conf.PROJECT_ROOT, 'apps/condo/domains/banking/utils/testSchema/assets/1CClientBankExchange.txt')

dayjs.extend(customParseFormat)

describe('convertFrom1CExchangeToSchema', () => {
    beforeAll(() => {
        fileReadStream = fs.createReadStream(filePath)
    })

    it('returns parsed bank account and transactions data', async () => {
        const { bankAccountData, bankTransactionsData } = await convertFrom1CExchangeToSchema(fileReadStream)
        expect(bankAccountData).toMatchObject({
            number: '40702810801500116391',
            routingNumber: '044525999',
            meta: {
                amount: '135394.23',
                amountAt: dayjs('27.10.2022', 'DD.MM.YYYY', true),
                '1CClientBankExchange': {
                    'v': '1.03',
                    'data': {
                        'ДатаНачала': '01.04.2022',
                        'ДатаКонца': '27.10.2022',
                        'РасчСчет': '40702810801500116391',
                        'НачальныйОстаток': '8300.00',
                        'ВсегоПоступило': '2681831.46',
                        'ВсегоСписано': '2554737.23',
                        'КонечныйОстаток': '135394.23',
                    },
                },
            },
        })
        expect(bankTransactionsData[0]).toMatchObject(PARSED_TRANSACTIONS_TO_COMPARE[0])
        expect(bankTransactionsData[1]).toMatchObject(PARSED_TRANSACTIONS_TO_COMPARE[1])
        expect(bankTransactionsData[2]).toMatchObject(PARSED_TRANSACTIONS_TO_COMPARE[2])
        expect(bankTransactionsData[3]).toMatchObject(PARSED_TRANSACTIONS_TO_COMPARE[3])
    })

    it('throws error on unexpected attribute in "СекцияРасчСчет"', async () => {
        const readeableStream = Readable.from([
            '1CClientBankExchange\n' +
            'ВерсияФормата=1.03\n' +
            'Кодировка=Windows\n' +
            'Отправитель=Банк Тестовый\n' +
            'Получатель=\n' +
            'ДатаСоздания=27.10.2022\n' +
            'ВремяСоздания=15:43:31\n' +
            'ДатаНачала=01.04.2022\n' +
            'ДатаКонца=27.10.2022\n' +
            'РасчСчет=40702810801500116391\n' +
            'СекцияРасчСчет\n' +
            'ДатаНачала=01.04.2022\n' +
            'ДатаКонца=27.10.2022\n' +
            'НеизвестноеСвойство=123\n' +
            'РасчСчет=40702810801500116391\n' +
            'НачальныйОстаток=8300.00\n' +
            'ВсегоПоступило=2681831.46\n' +
            'ВсегоСписано=2554737.23\n' +
            'КонечныйОстаток=135394.23\n' +
            'КонецРасчСчет',
        ])
        await catchErrorFrom(async () => {
            await convertFrom1CExchangeToSchema(readeableStream)
        }, e => {
            expect(e.message).toEqual('Invalid node "СекцияРасчСчет" at line 14')
        })
    })

    it('throws error on unexpected attribute in "СекцияДокумент"', async () => {
        const readeableStream = Readable.from([
            '1CClientBankExchange\n' +
            'ВерсияФормата=1.03\n' +
            'Кодировка=Windows\n' +
            'Отправитель=Банк Тестовый\n' +
            'Получатель=\n' +
            'ДатаСоздания=27.10.2022\n' +
            'ВремяСоздания=15:43:31\n' +
            'ДатаНачала=01.04.2022\n' +
            'ДатаКонца=27.10.2022\n' +
            'РасчСчет=40702810801500116391\n' +
            'СекцияРасчСчет\n' +
            'ДатаНачала=01.04.2022\n' +
            'ДатаКонца=27.10.2022\n' +
            'РасчСчет=40702810801500116391\n' +
            'НачальныйОстаток=8300.00\n' +
            'ВсегоПоступило=2681831.46\n' +
            'ВсегоСписано=2554737.23\n' +
            'КонечныйОстаток=135394.23\n' +
            'КонецРасчСчет\n' +
            'СекцияДокумент=Платежное требование\n' +
            'Номер=61298\n' +
            'Дата=15.04.2022\n' +
            'Сумма=700\n' +
            'ПлательщикСчет=40702810801500116391\n' +
            'НеизвестноеСвойство=123\n',
            'ДатаСписано=15.04.2022\n' +
            'ПлательщикИНН=6671093163\n' +
            'Плательщик1=ООО УК "БАЗА"\n' +
            'ПлательщикРасчСчет=40702810801500116391\n' +
            'ПлательщикБанк1=ТОЧКА ПАО БАНКА «ФК ОТКРЫТИЕ»\n' +
            'ПлательщикБанк2=МОСКВА\n' +
            'ПлательщикБИК=044525999\n' +
            'ПлательщикКорсчет=30101810845250000999\n' +
            'ПолучательСчет=60322810700500000191',
        ])
        await catchErrorFrom(async () => {
            await convertFrom1CExchangeToSchema(readeableStream)
        }, e => {
            expect(e.message).toEqual('Invalid node "СекцияДокумент" at line 25')
        })
    })

    it('throws error on blank line', async () => {
        const readeableStream = Readable.from([
            '1CClientBankExchange\n' +
            'ВерсияФормата=1.03\n' +
            '\n' +
            'КонецРасчСчет',
        ])
        await catchErrorFrom(async () => {
            await convertFrom1CExchangeToSchema(readeableStream)
        }, e => {
            expect(e.message).toEqual('Unexpected blank line 3')
        })
    })

    it('throws error on unexpected node', async () => {
        const readeableStream = Readable.from([
            '1CClientBankExchange\n' +
            'ВерсияФормата=1.03\n' +
            'Кодировка=Windows\n' +
            'Отправитель=Банк Тестовый\n' +
            'Получатель=\n' +
            'ДатаСоздания=27.10.2022\n' +
            'ВремяСоздания=15:43:31\n' +
            'ДатаНачала=01.04.2022\n' +
            'ДатаКонца=27.10.2022\n' +
            'РасчСчет=40702810801500116391\n' +
            'СекцияРасчСчет\n' +
            'ДатаНачала=01.04.2022\n' +
            'ДатаКонца=27.10.2022\n' +
            'РасчСчет=40702810801500116391\n' +
            'НачальныйОстаток=8300.00\n' +
            'ВсегоПоступило=2681831.46\n' +
            'ВсегоСписано=2554737.23\n' +
            'КонечныйОстаток=135394.23\n' +
            'КонецРасчСчет\n' +
            'СекцияНеизвестная',
        ])
        await catchErrorFrom(async () => {
            await convertFrom1CExchangeToSchema(readeableStream)
        }, e => {
            expect(e.message).toEqual('Unexpected node name "СекцияНеизвестная" at line 20')
        })
    })
})