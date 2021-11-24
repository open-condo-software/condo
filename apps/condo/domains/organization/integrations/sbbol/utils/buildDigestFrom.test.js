const { buildDigestFrom } = require('./buildDigestFrom')

describe('buildDigestFrom', () => {
    it('returns digest, that is equal to what SBBOL API returns', () => {
        const requestBody = {
            acceptanceTerm: '5',
            amount: '1',
            date: '2021-10-14',
            deliveryKind: 'электронно',
            externalId: '331a20d5-4d81-4344-b124-bcca6bc9e7ab',
            operationCode: '06',
            payeeAccount: '40702810740234701526',
            payeeBankBic: '044525225',
            payeeBankCorrAccount: '30101810400000000225',
            payeeInn: '5053882482',
            payeeName: 'Общество с ограниченной ответственностью "ПАРТНЕР-661"',
            payerAccount: '40702810738203653934',
            payerBankBic: '044525225',
            payerBankCorrAccount: '30101810400000000225',
            payerInn: '7784523718',
            payerName: 'ООО "ТО-Партнер-626-01"',
            paymentCondition: '1',
            priority: '1',
            purpose: 'Оплата подписки СББОЛ на период с 2021-10-14 по 2022-10-14',
            vat: {
                amount: 0,
                rate: 0,
                type: 'NO_VAT',
            },
            voCode: '61150',
            firstUnrelatedField: null,
            secondUnrelatedField: undefined,
        }

        const correctDigest = '' +
            'acceptanceTerm=5\n' +
            'amount=1\n' +
            'date=2021-10-14\n' +
            'externalId=331a20d5-4d81-4344-b124-bcca6bc9e7ab\n' +
            'operationCode=06\n' +
            'payeeAccount=40702810740234701526\n' +
            'payeeBankBic=044525225\n' +
            'payeeBankCorrAccount=30101810400000000225\n' +
            'payeeInn=5053882482\n' +
            'payeeName=Общество с ограниченной ответственностью "ПАРТНЕР-661"\n' +
            'payerAccount=40702810738203653934\n' +
            'payerBankBic=044525225\n' +
            'payerBankCorrAccount=30101810400000000225\n' +
            'payerInn=7784523718\n' +
            'payerName=ООО "ТО-Партнер-626-01"\n' +
            'paymentCondition=1\n' +
            'priority=1\n' +
            'purpose=Оплата подписки СББОЛ на период с 2021-10-14 по 2022-10-14\n' +
            'voCode=61150'

        expect(buildDigestFrom(requestBody)).toEqual(correctDigest)
    })
})