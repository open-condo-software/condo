import { faker } from '@faker-js/faker'

import { setFakeClientMode } from '@open-condo/keystone/test.utils'

import { Payment } from '@condo/domains/acquiring/utils/testSchema'
import { connectPaymentsToBillingReceiptsForOrganization } from '@condo/domains/billing/tasks/connectPaymentsToBillingReceiptsForOrganization'
import { ResidentTestMixin } from '@condo/domains/billing/utils/testSchema/mixins/resident'
import { AcquiringTestMixin, BillingTestMixin, TestUtils } from '@condo/domains/billing/utils/testSchema/testUtils'

const index = require('@app/condo/index')



describe('connectPaymentsToBillingReceiptsForOrganization', () => {
    setFakeClientMode(index)
    
    let utils
    beforeAll(async () => {
        utils = new TestUtils([BillingTestMixin, AcquiringTestMixin, ResidentTestMixin])
        await utils.init()
    })
    
    test('should connect payment for virtual receipt to actual receipt after it\'s load in system', async () => {
        const accountNumber = faker.random.alphaNumeric(12)
        const total = '5000.00'
        const partialPay = '2600.00'
        const jsonReceipt = utils.createJSONReceipt({ accountNumber, toPay: total })
        const resident = await utils.createResident()
        await utils.createServiceConsumer(resident, accountNumber)
        const multiPaymentId = await utils.partialPayForReceipt(jsonReceipt, partialPay)
        const [[receipt]] = await utils.createReceipts([jsonReceipt])

        await connectPaymentsToBillingReceiptsForOrganization([receipt])

        const [payments] = await Payment.getAll(resident, {
            multiPayment: { id: multiPaymentId },
        })

        expect(payments).toHaveLength(1)
        expect(payments[0].receipt).toBeDefined()
        expect(payments[0].receipt.id).toBe(receipt.id)
    })
})