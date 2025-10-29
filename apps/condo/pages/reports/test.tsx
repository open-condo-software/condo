import { MultiPaymentStatusType } from '@app/condo/schema'
import Head from 'next/head'
import React from 'react'

import { AcquiringReceipt } from '@condo/domains/acquiring/components/AcquiringReceipt'

const MOCK_RECEIPT_DATA = {
    documentNumber: 'РБ-2024-001234',
    documentTitle: 'Чек об оплате',
    paymentDateTime: new Date('2024-10-27T12:00:00').toISOString(),
    status: MultiPaymentStatusType.Done,
    payerInfo: [
        { key: 'ФИО плательщика', value: 'Иванов Иван Иванович' },
        { key: 'Адрес', value: 'г. Москва, ул. Ленина, д. 1, кв. 1' },
        { key: 'Лицевой счет', value: '123456789' },
    ],
    totalSum: {
        amountWithExplicits: '9500.00',
        currencyCode: 'RUB',
        explicitFee: '50.00',
        explicitServiceCharge: '100.00',
    },
    receipts: [
        {
            title: 'Квитанция №1',
            amount: '5000.00',
            info: [
                { key: 'Период', value: 'Октябрь 2024' },
                { key: 'Поставщик', value: 'ООО "Управляющая компания"' },
            ],
            rows: [
                { name: 'Содержание жилья', toPay: '2500.00' },
                { name: 'Отопление', toPay: '1500.00' },
                { name: 'Водоснабжение', toPay: '1000.00' },
            ],
            explicitFee: '25.00',
            explicitServiceCharge: '50.00',
        },
        {
            title: 'Квитанция №2',
            amount: '4500.00',
            info: [
                { key: 'Период', value: 'Сентябрь 2024' },
                { key: 'Поставщик', value: 'ООО "Управляющая компания"' },
            ],
            rows: [
                { name: 'Содержание жилья', toPay: '2500.00' },
                { name: 'Отопление', toPay: '1200.00' },
                { name: 'Водоснабжение', toPay: '800.00' },
            ],
            explicitFee: '25.00',
            explicitServiceCharge: '50.00',
        },
    ],
    invoices: [
        {
            number: 'INV-2024-001',
            date: '01.10.2024',
            amount: '5000.00',
            taxRegime: 'USN',
            vatAmount: {
                '20': '833.33',
            },
            info: [
                { key: 'ИНН поставщика', value: '7701234567' },
                { key: 'КПП поставщика', value: '770101001' },
            ],
            rows: [
                {
                    name: 'Услуги ЖКХ',
                    toPay: '2500.00',
                    count: 1,
                    vatPercent: '20',
                    amount: '2500.00',
                },
                {
                    name: 'Коммунальные услуги',
                    toPay: '2500.00',
                    count: 1,
                    vatPercent: '20',
                    amount: '2500.00',
                },
            ],
        },
    ],
}

const TestReceiptPage: React.FC = () => {
    return (
        <>
            <Head>
                <title>Тестовая страница чека</title>
            </Head>
            <AcquiringReceipt
                {...MOCK_RECEIPT_DATA}
            />
        </>
    )
}

export default TestReceiptPage
