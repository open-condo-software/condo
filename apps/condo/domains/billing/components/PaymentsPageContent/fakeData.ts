// TODO (savelevMatthew): remove this file
import dayjs from 'dayjs'
import { buildFakeAddressAndMeta } from '@condo/domains/property/utils/testSchema/factories'
import { DEFAULT_PAGE_SIZE } from '@condo/domains/common/components/Table/Index'

const faker = require('faker')
const nowDate = dayjs().toISOString()

const payments =  { min: 100, max: 20000 }
function getToPay (min, max) {
    return `${Math.floor(min + Math.random() * (max - min))}.00`
}

export const objs = [...Array(DEFAULT_PAGE_SIZE).keys()].map(() => {
    const { address, addressMeta } = buildFakeAddressAndMeta(true)
    const unitName = addressMeta.data.flat
    return {
        id: faker.datatype.uuid(),
        date: nowDate,
        account: { number: String(faker.datatype.number()) },
        property: { address, unitName },
        type: Math.random() > 0.5 ? 'ЕПС' : 'Расчетный банк',
        transaction: faker.datatype.uuid().toUpperCase(),
        toPay: getToPay(payments.min, payments.max),
    }
})
