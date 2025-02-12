/**
 * @jest-environment node
 */
import { setFakeClientMode } from '@open-condo/keystone/test.utils'

import { linkVirtualPaymentsToReceipts } from './linkVirtualPaymentsToReceipts'

import { createTestBillingAccount, createTestBillingProperty } from '../../billing/utils/testSchema'
import { AcquiringTestMixin, BillingTestMixin, TestUtils } from '../../billing/utils/testSchema/testUtils'
import { registerMultiPaymentForVirtualReceiptByTestClient } from '../utils/testSchema'

const index = require('@app/condo/index')

describe('linkReceiptsToPayment', () => {
    setFakeClientMode(index)

    test('test', async () => {
        const utils = new TestUtils([BillingTestMixin, AcquiringTestMixin])
        await utils.init()
        const [billingProperty] = await createTestBillingProperty(utils.clients.admin, utils.billingContext, {
            address: utils.property.address,
        })
        const [billingAccount] = await createTestBillingAccount(utils.clients.admin, utils.billingContext, billingProperty)

        const recipient =  {
            routingNumber: '044525256',
            bankAccount: '40702810996180000019',
            accountNumber: billingAccount.number,
        }

        const receipt = {
            currencyCode: 'RUB',
            amount: '100.45',
            period: '2022-09-01',
            recipient,
        }
        await registerMultiPaymentForVirtualReceiptByTestClient(utils.clients.admin, receipt, { id: utils.acquiringContext.id })
        await utils.createReceipts([
            utils.createJSONReceipt({ accountNumber: billingAccount.number, ...recipient, month: 9, year: 2022 }),
        ])
        
        await linkVirtualPaymentsToReceipts()
    })
})
