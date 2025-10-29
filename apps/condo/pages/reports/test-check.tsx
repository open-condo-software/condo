import { MultiPaymentStatusType } from '@app/condo/schema'
import Head from 'next/head'
import React from 'react'

import { PageWrapper, PageContent } from '@condo/domains/common/components/containers/BaseLayout'
import { Check } from '@eps/domains/eps/components/Check'

const MOCK_CHECK_DATA = {
    documentTitle: 'Чек об оплате\nжилищно-коммунальных услуг',
    operationDate: { key: 'Дата операции', value: '27.10.2024' },
    operationTime: { key: 'Время операции', value: '13:00:00' },
    operationNumber: { key: 'Номер операции', value: 'OP-2024-123456' },
    suip: { key: 'СУИП', value: '1234567890123456789012' },
    orderNumber: { key: 'Номер заказа', value: 'ORD-2024-789' },
    amount: { key: 'Сумма платежа', value: '9350.00' },
    commission: { key: 'Комиссия', value: '150.00' },
    total: { key: 'Итого к оплате', value: '9500.00' },
    personalAccount: { key: 'Лицевой счет', value: '123456789' },
    address: { key: 'Адрес', value: 'г. Москва, ул. Ленина, д. 1, кв. 1' },
    fio: { key: 'ФИО плательщика', value: 'Иванов Иван Иванович' },
    period: { key: 'Период', value: '2024-10-01' },
    services: [
        { name: 'Содержание жилья', amount: '2500.00' },
        { name: 'Отопление', amount: '2700.00' },
        { name: 'Холодное водоснабжение', amount: '800.00' },
        { name: 'Горячее водоснабжение', amount: '1200.00' },
        { name: 'Водоотведение', amount: '650.00' },
        { name: 'Электроэнергия', amount: '1500.00' },
    ],
    recipient: { key: 'Получатель', value: 'ООО "Управляющая компания Комфорт"' },
    tin: { key: 'ИНН', value: '7701234567' },
    bankAccount: { key: 'Расчетный счет', value: '40702810100000001234' },
    bankName: { key: 'Наименование банка', value: 'ПАО "Сбербанк России"' },
    bic: { key: 'БИК', value: '044525225' },
    offsettingAccount: { key: 'Корреспондентский счет', value: '30101810400000000225' },
    currencyCode: 'RUB',
    status: MultiPaymentStatusType.Done,
}

const TestCheckPage: React.FC = () => {
    return (
        <>
            <Head>
                <title>Тестовая страница чека EPS</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <Check {...MOCK_CHECK_DATA} />
                </PageContent>
            </PageWrapper>
        </>
    )
}

export default TestCheckPage
