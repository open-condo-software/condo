const fs = require('fs')
const path = require('path')

const dayjs = require('dayjs')
const customParseFormat = require('dayjs/plugin/customParseFormat')

const conf = require('@open-condo/config')
const { catchErrorFrom } = require('@open-condo/keystone/test.utils')

const { PARSED_TRANSACTIONS_TO_COMPARE } = require('@condo/domains/banking/utils/testSchema/assets/1CClientBankExchangeToKeystoneObjects')

const { convertFrom1CExchangeToSchema } = require('./convertFrom1CExchangeToSchema')
const { ConvertToUTF8 } = require('./convertToUTF8')

let fileStringContent

const filePath = path.resolve(conf.PROJECT_ROOT, 'apps/condo/domains/banking/utils/testSchema/assets/1CClientBankExchange.txt')
const fileBuffer = fs.readFileSync(filePath)

dayjs.extend(customParseFormat)

describe('convertFrom1CExchangeToSchema', () => {
    beforeAll(() => {
        const { result } = new ConvertToUTF8(fileBuffer).convert()
        fileStringContent = result
    })

    it('returns parsed bank account and transactions data', () => {
        const { bankAccountData, bankTransactionsData } = convertFrom1CExchangeToSchema(fileStringContent)
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

    it('do not throw an error if an unexpected attribute in "СекцияРасчСчет"', async () => {
        const stringContent = [
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
        ].join('')
        convertFrom1CExchangeToSchema(stringContent)
    })

    it('do not throw an error if an unexpected attribute in "СекцияДокумент"', async () => {
        const stringContent = [
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
            'ПолучательСчет=40702810517000008238\n' +
            'ПлательщикРасчСчет=40702810308500000463\n' +
            'ПлательщикБанк1=ТОЧКА ПАО БАНКА «ФК ОТКРЫТИЕ»\n' +
            'ПлательщикБанк2=МОСКВА\n' +
            'ПлательщикБИК=044525999\n' +
            'ПлательщикКорсчет=30101810845250000999\n' +
            'НеизвестноеСвойство=123\n' +
            'ДатаСписано=15.04.2022\n' +
            'ДатаПоступило=\n' +
            'ПлательщикИНН=6671093163\n' +
            'Плательщик1=ООО "ВВК ИВАНОВО"\n' +
            'ПолучательИНН=3702110352\n' +
            'Получатель1=ООО "УЗ ОБЛАСТНОЙ ДИАГНОСТИЧЕСКИЙ ЦЕНТР"\n' +
            'ПолучательРасчСчет=40402820517020008238\n' +
            'ПолучательБанк1=ИВАНОВСКОЕ ОТДЕЛЕНИЕ N 5639 ПАО СБЕРБАНК\n' +
            'ПолучательБанк2=г. Иваново\n' +
            'ПолучательБИК=042302608\n' +
            'ПолучательКорсчет=30103810006020000608\n' +
            'ВидПлатежа=Электронно\n' +
            'ВидОплаты=01\n' +
            'Код=0\n' +
            'ПлательщикКПП=370321001\n' +
            'ПолучательКПП=370202301\n' +
            'СрокПлатежа=08.07.2022\n' +
            'Очередность=5\n' +
            'НазначениеПлатежа=Оплата по сч.№ 183 от 31.05.2022 г, № 211 от 30.06.2022 г за медицинские услуги, без НДС\n' +
            'КонецДокумента',
        ].join('')
        convertFrom1CExchangeToSchema(stringContent)
    })


    it('do not write contractorAccount in transactionsData if required fields not found in "СекцияДокумент"', async () => {
        const stringContent = [
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
            'ПолучательСчет=40702810517000008238\n' +
            'ПлательщикРасчСчет=40702810308500000463\n' +
            'ПлательщикБанк1=ТОЧКА ПАО БАНКА «ФК ОТКРЫТИЕ»\n' +
            'ПлательщикБанк2=МОСКВА\n' +
            'ПлательщикБИК=044525999\n' +
            'ПлательщикКорсчет=30101810845250000999\n' +
            'НеизвестноеСвойство=123\n' +
            'ДатаСписано=15.04.2022\n' +
            'ДатаПоступило=\n' +
            'ПлательщикИНН=6671093163\n' +
            'Плательщик1=ООО "ВВК ИВАНОВО"\n' +
            'ПолучательИНН=' +
            'Получатель1=ООО "УЗ ОБЛАСТНОЙ ДИАГНОСТИЧЕСКИЙ ЦЕНТР"\n' +
            'ПолучательРасчСчет=40402820517020008238\n' +
            'ПолучательБанк1=ИВАНОВСКОЕ ОТДЕЛЕНИЕ N 5639 ПАО СБЕРБАНК\n' +
            'ПолучательБанк2=г. Иваново\n' +
            'ПолучательБИК=042302608\n' +
            'ПолучательКорсчет=30103810006020000608\n' +
            'ВидПлатежа=Электронно\n' +
            'ВидОплаты=01\n' +
            'Код=0\n' +
            'ПлательщикКПП=370321001\n' +
            'ПолучательКПП=0\n' +
            'СрокПлатежа=08.07.2022\n' +
            'Очередность=5\n' +
            'НазначениеПлатежа=Оплата по сч.№ 183 от 31.05.2022 г, № 211 от 30.06.2022 г за медицинские услуги, без НДС\n' +
            'КонецДокумента',
        ].join('')
        const { bankTransactionsData } = convertFrom1CExchangeToSchema(stringContent)
        expect(bankTransactionsData.contractorAccount).toBeUndefined()
    })

    it('do not throws error on unexpected node', async () => {
        const stringContent = [
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
        ].join('')
        convertFrom1CExchangeToSchema(stringContent)
    })

    it('do not throws error on not required node "ВремяСоздания"', async () => {
        const stringContent = [
            '1CClientBankExchange\n' +
            'ВерсияФормата=1.03\n' +
            'Кодировка=Windows\n' +
            'Отправитель=Банк Тестовый\n' +
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
        ].join('')
        convertFrom1CExchangeToSchema(stringContent)
    })

    it('throw an error if the required key is not found in "СекцияРасчСчет"', async () => {
        const stringContent = [
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
            'КонецРасчСчет',
        ].join('')
        await catchErrorFrom(async () => {
            convertFrom1CExchangeToSchema(stringContent)
        }, e => {
            expect(e.message).toEqual('Line "КонечныйОстаток" not found in node "СекцияРасчСчет".')
        })
    })

    it('throw an error if the required key is not found in "СекцияДокумент"', async () => {
        const stringContent = [
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
            'ПолучательСчет=60322810700500000191\n' +
            'КонецДокумента',
        ].join('')
        await catchErrorFrom(async () => {
            convertFrom1CExchangeToSchema(stringContent)
        }, e => {
            expect(e.message).toEqual('Line "НазначениеПлатежа" not found in node "СекцияДокумент".')
        })
    })

    it('throws error on blank line', async () => {
        const stringContent = [
            '1CClientBankExchange\n' +
            'ВерсияФормата=1.03\n' +
            '\n' +
            'КонецРасчСчет',
        ].join('')
        await catchErrorFrom(async () => {
            convertFrom1CExchangeToSchema(stringContent)
        }, e => {
            expect(e.message).toEqual('Unexpected blank line 3')
        })
    })

    it('throw an error if the required key is not found in "1CClientBankExchange"', async () => {
        const stringContent = [
            '1CClientBankExchange\n' +
            'Кодировка=Windows\n' +
            'Получатель=\n' +
            'ДатаСоздания=27.10.2022\n' +
            'ВремяСоздания=15:43:31\n' +
            'ДатаНачала=01.04.2022\n' +
            'ДатаКонца=27.10.2022\n' +
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
        ].join('')
        await catchErrorFrom(async () => {
            convertFrom1CExchangeToSchema(stringContent)
        }, e => {
            expect(e.message).toEqual('Line "ВерсияФормата" not found in node "1CClientBankExchange".')
        })    })
})
